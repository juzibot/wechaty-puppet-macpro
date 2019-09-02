/**
 *   Wechaty - https://github.com/chatie/wechaty
 *
 *   @copyright 2016-2018 Huan LI <zixia@zixia.net>
 *
 *   Licensed under the Apache License, Version 2.0 (the "License")
 *   you may not use this file except in compliance with the License.
 *   You may obtain a copy of the License at
 *
 *       http://www.apache.org/licenses/LICENSE-2.0
 *
 *   Unless required by applicable law or agreed to in writing, software
 *   distributed under the License is distributed on an "AS IS'
 *   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *   See the License for the specific language governing permissions and
 *   limitations under the License.
 *
 */

import { FileBox } from 'file-box'

import flatten  from 'array-flatten'

import path from 'path'

import util from 'util' // 打印对象用的

import LRU from 'lru-cache'

import { v4 as uuid } from 'uuid'

import {
  ContactGender,
  ContactPayload,
  ContactType,

  FriendshipPayload,

  MessagePayload,
  MessageType,

  Puppet,
  PuppetOptions,

  Receiver,

  RoomInvitationPayload,
  RoomMemberPayload,
  RoomPayload,

  UrlLinkPayload,
  MiniProgramPayload,
  ScanStatus,
}                           from 'wechaty-puppet'

import {
  GRPC_ENDPOINT,
  log,
  macproToken,
  MESSAGE_CACHE_AGE,
  MESSAGE_CACHE_MAX,
  qrCodeForChatie,
  retry,
  VERSION,
}                                   from './config'

import { DelayQueueExecutor } from 'rx-queue'

import {
  GrpcPrivateMessagePayload,
  MacproMessageType,
  MiniProgram,
  RequestStatus,
  GrpcFriendshipRawPayload,
  GrpcPublicMessagePayload,
  GrpcLoginInfo,
  MacproMessagePayload,
} from './schemas'

import { RequestClient } from './utils/request'
import { CacheManageError, NoIDError } from './utils/errorMsg'
import { MacproContactPayload, ContactList, GrpcContactPayload, AliasModel } from './schemas/contact'
import { CacheManager } from './cache-manager'
import { GrpcGateway } from './gateway/grpc-api'
import MacproContact from './mac-api/contact'
import MacproUser from './mac-api/user'
import MacproMessage from './mac-api/message'
import { MacproRoomPayload, GrpcRoomMemberPayload, MacproRoomInvitationPayload, GrpcRoomPayload, MacproCreateRoom, GrpcRoomQrcode, GrpcRoomDetailInfo, GrpcRoomMember, MacproRoomMemberPayload } from './schemas/room'
import MacproRoom from './mac-api/room'
import {
  fileBoxToQrcode,
  friendshipConfirmEventMessageParser,
  friendshipReceiveEventMessageParser,
  friendshipVerifyEventMessageParser,
  isStrangerV1,
  messageRawPayloadParser,
  newFriendMessageParser,
} from './pure-function-helpers'
import { roomJoinEventMessageParser } from './pure-function-helpers/room-event-join-message-parser'
import { roomLeaveEventMessageParser } from './pure-function-helpers/room-event-leave-message-parser'
import { roomTopicEventMessageParser } from './pure-function-helpers/room-event-topic-message-parser'
import { messageUrlPayloadParser } from './pure-function-helpers/message-url-payload-parser'

const PRE = 'PUPPET_MACPRO'

export class PuppetMacpro extends Puppet {

  public static readonly VERSION = VERSION

  private readonly cacheMacproMessagePayload: LRU<string, MacproMessagePayload>

  private loopTimer?: NodeJS.Timer

  private cacheManager?: CacheManager

  private grpcGateway: GrpcGateway

  private requestClient: RequestClient

  private contact: MacproContact

  private user: MacproUser

  private message: MacproMessage

  private room: MacproRoom

  private apiQueue: DelayQueueExecutor

  constructor (
    public options: PuppetOptions = {},
  ) {
    super(options)
    const lruOptions: LRU.Options<string, MacproMessagePayload> = {
      dispose (key: string, val: any) {
        log.silly(PRE, `constructor() lruOptions.dispose(${key}, ${JSON.stringify(val)})`)
      },
      max: MESSAGE_CACHE_MAX,
      maxAge: MESSAGE_CACHE_AGE,
    }

    this.cacheMacproMessagePayload = new LRU<string, MacproMessagePayload>(lruOptions)

    const token = options.token || macproToken()
    if (token) {
      this.grpcGateway = new GrpcGateway(token, GRPC_ENDPOINT)
      this.requestClient = new RequestClient(this.grpcGateway)
      this.contact = new MacproContact(this.requestClient)
      this.user = new MacproUser(token, this.requestClient)
      this.message = new MacproMessage(this.requestClient)
      this.room = new MacproRoom(this.requestClient)
      this.apiQueue = new DelayQueueExecutor(30)
    } else {
      log.error(PRE, `can not get token info from options for start grpc gateway.`)
      throw new Error(`can not get token info.`)
    }
  }

  public async start (): Promise<void> {

    log.silly(PRE, `start()`)

    this.state.on('pending')

    this.grpcGateway.on('reconnect', async () => {
      await this.stop()
      await this.start()
    })

    this.grpcGateway.on('scan', async dataStr => {
      log.verbose(PRE, `
      ======================================
                   grpc on scan
      ======================================
      `)

      const data = JSON.parse(dataStr)

      const fileBox = FileBox.fromUrl(data.url)
      const url = await fileBoxToQrcode(fileBox)
      this.emit('scan', url, ScanStatus.Cancel)
    })

    this.grpcGateway.on('login', async dataStr => {
      log.verbose(PRE, `
      ======================================
                 grpc on login
      ======================================
      `)
      const data: GrpcLoginInfo = JSON.parse(dataStr)
      log.silly(PRE, `
      ========================================
      login data : ${util.inspect(data)}
      ========================================
      `)
      const wxid = data.account_alias

      log.verbose(PRE, `init cache manager`)
      await CacheManager.init(wxid)
      this.cacheManager = CacheManager.Instance

      const selfPayload: MacproContactPayload = {
        account: data.account,
        accountAlias: data.account_alias,
        area: '',
        description: '',
        disturb: '',
        formName: '',
        name: data.name,
        sex: ContactGender.Unknown,
        thumb: data.thumb,
        v1: '',
      }
      await this.cacheManager.setContact(selfPayload.accountAlias, selfPayload)
      await this.cacheManager.setAccountWXID(selfPayload.account, selfPayload.accountAlias)
      await this.login(wxid)

    })

    this.grpcGateway.on('message', data => this.onProcessMessage(JSON.parse(data)))

    this.grpcGateway.on('contact-list', data => this.setContactToCache(data))

    this.grpcGateway.on('room-member', async memberStr => {

      const members: GrpcRoomMemberPayload[] = JSON.parse(memberStr).memberList
      const macproMembers: MacproRoomMemberPayload[] = []
      log.verbose(PRE, `room ID : ${members[0].number} has ${members.length} members.`)
      let payload: { [contactId: string]: MacproRoomMemberPayload } = {}
      log.silly(PRE, `members[0] : ${util.inspect(members[0])}`)
      members.map(async member => {
        if (member.userName) {
          const roomMemberPayload: MacproRoomMemberPayload = {
            account: member.userName,
            accountAlias: '',
            area: '',
            description: '',
            disturb: '',
            formName: member.displayName,
            name: member.nickName,
            sex: ContactGender.Unknown,
            thumb: member.bigHeadImgUrl,
            v1: '',
          }
          macproMembers.push(roomMemberPayload)
          payload[member.userName] = roomMemberPayload
          if (!this.cacheManager) {
            throw CacheManageError('ROOM-MEMBER')
          }

          const _contact = await this.cacheManager.getContact(member.userName)
          if (!_contact) {
            const contact: MacproContactPayload = {
              account: '',
              accountAlias: member.userName,
              area: '',
              description: '',
              disturb: '',
              formName: member.displayName,
              name: member.nickName,
              sex: ContactGender.Unknown,
              thumb: member.bigHeadImgUrl,
              v1: '',
            }
            await this.cacheManager.setContact(member.userName, contact)
            await this.cacheManager.setAccountWXID(member.userName, '')
          }
          await this.cacheManager.setRoomMember(member.number, payload)

        } else {
          log.silly(PRE, `can not get member user name`)
        }
      })

      const roomId = members[0].number
      if (!this.cacheManager) {
        throw CacheManageError('ROOM-MEMBER')
      }
      const room = await this.cacheManager.getRoom(roomId)
      if (!room) {
        throw new Error(`can not find room info by room id: ${roomId}`)
      }
      room.members = macproMembers

      await this.cacheManager.setRoom(room.number, room)

    })

    this.grpcGateway.on('logout', async () => {
      log.verbose(PRE, `
      ======================================
                 grpc on logout
      ======================================
      `)

      await this.logout()
    })

    this.grpcGateway.on('not-login', async (dataStr: string) => {
      log.verbose(PRE, `
      ======================================
               grpc on not-login
      ======================================
      `)
      log.silly(PRE, `dataStr : ${util.inspect(dataStr)}`)
      let account = JSON.parse(dataStr).account
      if (!account) {
        await this.user.getWeChatQRCode()
      } else {
        await this.user.getWeChatQRCode() // TODO: need params : account
      }

    })

    this.grpcGateway.on('new-friend', async (data: string) => {
      const friendshipRawPayload: GrpcFriendshipRawPayload = JSON.parse(data)
      log.silly(PRE, `
      ===============================
      friendship raw payload: ${JSON.stringify(friendshipRawPayload)}
      ===============================
      `)
      const id = uuid()
      if (!this.cacheManager) {
        log.verbose(`Can not save friendship raw payload to cache since cache manager is not inited.`)
        return
      }
      const payload = friendshipReceiveEventMessageParser(friendshipRawPayload)
      if (payload) {
        await this.cacheManager.setFriendshipRawPayload(id, payload)
        this.emit('friendship', id)
      }
    })

    await this.grpcGateway.notify('getLoginUserInfo', {
      my_account: '',
    })

    this.state.on(true)
  }

  protected async login (selfId: string): Promise<void> {
    log.verbose(PRE, `login success, loading contact and room data.`)

    await super.login(selfId)

    const contactStatus = await this.contact.contactList(selfId)
    if (contactStatus === RequestStatus.Fail) {
      throw new Error(`load contact list failed.`)
    }
    await this.getAllRoom(selfId)
  }

  private async getAllRoom (selfId: string): Promise<void> {
    log.verbose(PRE, `getAllRoom()`)

    const pageRoom: GrpcRoomPayload[] = await this.room.roomList(selfId)
    log.silly(PRE, `pageRome : ${pageRoom}`)
    log.verbose(PRE, `room number: ${pageRoom.length}`)

    await this.getRoomDetailInfo(pageRoom)

  }

  private async getRoomDetailInfo (allRoom: GrpcRoomPayload[]): Promise<void> {
    log.verbose(PRE, `getRoomDetailInfo()`)

    allRoom.forEach(async r => {
      await this.apiQueue.execute(async () => {
        if (!this.id) {
          throw NoIDError('getRoomDetailInfo()')
        }

        const res = await this.room.roomOwner(this.id, r.number)

        const room: MacproRoomPayload = {
          disturb: r.disturb,
          members: [],
          name: r.name,
          number: r.number,
          owner: res.author,
          thumb: r.thumb,
        }
        if (!this.cacheManager) {
          throw CacheManageError('getRoomDetailInfo()')
        }
        await this.cacheManager.setRoom(r.number, room)

        await this.room.roomMember(this.id, r.number)
      })
    })
  }

  protected async onProcessMessage (messagePayload: GrpcPrivateMessagePayload | GrpcPublicMessagePayload) {

    log.verbose(PRE, `onProcessMessage()`)
    log.silly(PRE, `message payload : ${JSON.stringify(messagePayload)}`)
    const contentType = messagePayload.content_type

    if (!contentType) {
      const contactPayload = newFriendMessageParser(messagePayload as any)
      if (this.cacheManager && contactPayload !== null) {
        await this.saveContactRawPayload(contactPayload)
      }
      return
    }

    const messageId = uuid()

    const payload: MacproMessagePayload = {
      ...messagePayload,
      content_type: contentType,
      messageId,
      timestamp: messagePayload.send_time,
    }

    // Cache message for future usage
    this.cacheMacproMessagePayload.set(messageId, payload)

    /**
     * Save account and account_alias info into contact
     */
    if (this.cacheManager && payload.to_account && payload.to_account_alias) {
      const cacheContact = await this.cacheManager.getContact(payload.to_account_alias)
      if (cacheContact) {
        cacheContact.accountAlias = payload.to_account_alias
        cacheContact.account = payload.to_account
        await this.cacheManager.setContact(payload.to_account_alias, cacheContact)
      } else {
        const contact: MacproContactPayload = {
          account: payload.to_account,
          accountAlias: payload.to_account_alias,
          area: '',
          description: '',
          disturb: '',
          formName: payload.to_name,
          name: payload.to_name,
          sex: ContactGender.Unknown,
          thumb: '',
          v1: '',
        }
        await this.cacheManager.setContact(payload.to_account_alias, contact)
      }
      await this.cacheManager.setAccountWXID(payload.to_account, payload.to_account_alias)
    }

    const messageType = payload.content_type

    switch (messageType) {

      case MacproMessageType.Text:
        const textEventMatches = await Promise.all([
          this.onMacproMessageFriendshipEvent(payload),
        ])
        /**
         * If no event matched above, then emit the message
         */
        if (!textEventMatches.reduce((prev, cur) => prev || cur, false)) {
          this.emit('message', messageId)
        }
        break

      case MacproMessageType.Image:
      case MacproMessageType.Voice:
      case MacproMessageType.Video:
      case MacproMessageType.File:
        this.emit('message', messageId)
        break

      case MacproMessageType.PublicCard:
      case MacproMessageType.PrivateCard:
        this.emit('message', messageId)
        break

      case MacproMessageType.UrlLink:
        log.silly(PRE, `TODO UrlLink`)
        this.emit('message', messageId)
        break

      case MacproMessageType.System:
        const systemEventMatches = await Promise.all([
          this.onMacproMessageFriendshipEvent(payload),
          /* ----------------------------------------- */
          this.onMacproMessageRoomEventJoin(payload),
          this.onMacproMessageRoomEventLeave(payload),
          this.onMacproMessageRoomEventTopic(payload),
        ])
        /**
         * If no event matched above, then emit the message
         */
        if (!systemEventMatches.reduce((prev, cur) => prev || cur, false)) {
          this.emit('message', messageId)
        }
        break

      case MacproMessageType.MiniProgram:
        log.silly(PRE, `TODO MiniProgram message type`)
        this.emit('message', messageId)
        break

      case MacproMessageType.Location:
        log.silly(PRE, `TODO Location message type`)
        this.emit('message', messageId)
        break

      case MacproMessageType.RedPacket:
        log.silly(PRE, `TODO RedPacket message type`)
        this.emit('message', messageId)
        break

      case MacproMessageType.MoneyTransaction:
        log.silly(PRE, `TODO MoneyTransaction message type`)
        this.emit('message', messageId)
        break

      case MacproMessageType.Gif:
        log.silly(PRE, `TODO Gif`)
        this.emit('message', messageId)
        break

      default:
        this.emit('message', messageId)
        break
    }

  }

  public async setContactToCache (data: string): Promise<void> {
    log.verbose(PRE, `setContactToCache()`)

    const contactListInfo: ContactList = JSON.parse(data)
    const { currentPage, total, info } = contactListInfo
    if (currentPage * 100 > total) {
      log.verbose(PRE, `contact data loaded.`)
    }
    info.map(async (_contact: GrpcContactPayload) => {
      const contact: MacproContactPayload = {
        account: _contact.account,
        accountAlias: _contact.account_alias,
        area: _contact.area,
        description: _contact.description,
        disturb: _contact.disturb,
        formName: _contact.form_name,
        name: _contact.name,
        sex: parseInt(_contact.sex, 10) as ContactGender,
        thumb: _contact.thumb,
        v1: _contact.v1,
      }

      if (!this.cacheManager) {
        throw CacheManageError('setContactToCache()')
      }
      await this.saveContactRawPayload(contact)
    })

  }

  public async stop (): Promise<void> {

    log.silly(PRE, 'stop()')

    if (this.state.off()) {
      log.warn(PRE, 'stop() is called on a OFF puppet. await ready(off) and return.')
      await this.state.ready('off')
      return
    }

    this.state.off('pending')

    if (!this.id) {
      throw NoIDError('stop()')
    }
    await CacheManager.release()
    this.grpcGateway.removeAllListeners()
    await this.user.logoutWeChat(this.id)
  }

  public async logout (): Promise<void> {

    log.silly(PRE, 'logout()')

    if (!this.id) {
      throw NoIDError('logout()')
    }

    this.emit('logout', this.id) // be care we will throw above by logonoff() when this.user===undefined
    this.id = undefined
    this.state.off(true)

  }

  /**
   *
   * ContactSelf
   *
   *
   */
  public async contactSelfQrcode (): Promise<string> {
    log.verbose(PRE, 'contactSelfQrcode()')

    throw new Error('not supported')
  }

  public async contactSelfName (name: string): Promise<void> {
    log.verbose(PRE, 'contactSelfName(%s)', name)

    throw new Error('not supported')
  }

  public async contactSelfSignature (signature: string): Promise<void> {
    log.verbose(PRE, 'contactSelfSignature(%s)', signature)

    throw new Error('not supported')
  }

  /**
   *
   * Contact
   *
   */
  public contactAlias (contactId: string)                      : Promise<string>
  public contactAlias (contactId: string, alias: string | null): Promise<void>

  public async contactAlias (contactId: string, alias?: string | null): Promise<void | string> {
    log.verbose(PRE, 'contactAlias(%s, %s)', contactId, alias)

    if (!this.cacheManager) {
      throw CacheManageError('contactAlias()')
    }

    if (typeof alias === 'undefined') {
      const contact = await this.cacheManager.getContact(contactId)

      if (!contact) {
        throw new Error(`Can not find the contact by ${contactId}`)
      }

      return contact.formName
    } else {
      if (!this.id) {
        throw NoIDError(`contactAlias()`)
      }
      const aliasModel: AliasModel = {
        contactId,
        loginedId: this.id,
        remark: alias || '',
      }
      await this.contact.setAlias(aliasModel)
    }
  }

  public async contactList (): Promise<string[]> {
    log.verbose(PRE, 'contactList()')

    if (!this.cacheManager) {
      throw CacheManageError('contactList()')
    }

    return this.cacheManager.getContactIds()
  }

  public async contactQrcode (contactId: string): Promise<string> {
    if (contactId !== this.selfId()) {
      throw new Error('can not set avatar for others')
    }

    throw new Error('not supported')
  }

  public async contactAvatar (contactId: string)                : Promise<FileBox>
  public async contactAvatar (contactId: string, file: FileBox) : Promise<void>

  public async contactAvatar (contactId: string, file?: FileBox): Promise<void | FileBox> {
    log.verbose(PRE, 'contactAvatar(%s)', contactId)

    /**
     * 1. set
     */
    if (file) {
      throw new Error('not supported')
    }

    /**
     * 2. get
     */
    if (!this.cacheManager) {
      throw CacheManageError('contactAvatar()')
    }

    const contact = await this.cacheManager.getContact(contactId)

    if (!contact) {
      throw new Error(`Can not find the contact by ${contactId}`)
    }

    return FileBox.fromUrl(contact.thumb)
  }

  public async contactRawPayload (id: string): Promise<MacproContactPayload> {
    log.verbose(PRE, 'contactRawPayload(%s)', id)

    if (!this.cacheManager) {
      throw CacheManageError('contactRawPayload()')
    }
    if (!this.id) {
      throw NoIDError('contactRawPayload()')
    }

    let rawPayload = await this.cacheManager.getContact(id)
    if (!rawPayload) {
      const wxid = await this.cacheManager.getAccountWXID(id)
      if (wxid) {
        rawPayload = await this.cacheManager.getContact(wxid)
      }
    }

    log.silly(PRE, `contact rawPayload : ${util.inspect(rawPayload)}`)
    if (!rawPayload) {
      rawPayload = await this.contact.getContactInfo(this.id, id)
      log.silly(PRE, `rawPayload from API : ${util.inspect(rawPayload)}`)
      if (!rawPayload) {
        throw new Error(`can not find contact by wxid : ${id}`)
      }
    }
    await this.saveContactRawPayload(rawPayload)

    return rawPayload
  }

  private async saveContactRawPayload (rawPayload: MacproContactPayload) {
    if (!this.cacheManager) {
      throw CacheManageError('saveContactRawPayload()')
    }
    if (rawPayload.accountAlias) {
      await this.cacheManager.setContact(rawPayload.accountAlias, rawPayload)
      await this.cacheManager.setAccountWXID(rawPayload.account, rawPayload.accountAlias)
    } else {
      await this.cacheManager.setContact(rawPayload.account, rawPayload)
      await this.cacheManager.setAccountWXID(rawPayload.account, '')
    }
  }

  public async contactRawPayloadParser (rawPayload: MacproContactPayload): Promise<ContactPayload> {
    log.verbose(PRE, 'contactRawPayloadParser(%s)', rawPayload)

    const payload: ContactPayload = {
      address   : rawPayload.area,
      alias     : rawPayload.formName,
      avatar : rawPayload.thumb,
      city      : rawPayload.area,
      friend    : isStrangerV1(rawPayload.v1),
      gender : rawPayload.sex,
      id     : rawPayload.accountAlias || rawPayload.account,
      name   : rawPayload.name,
      province  : rawPayload.area,
      signature : rawPayload.description,
      type   : ContactType.Personal,
      weixin    : rawPayload.account,
    }
    return payload
  }

  /**
   *
   * Message
   *
   */
  public async messageSendText (
    receiver : Receiver,
    text     : string,
    mentionIdList?: string[],
  ): Promise<void> {

    log.silly(PRE, 'messageSend(%s, %s)', JSON.stringify(receiver), text)

    const contactIdOrRoomId =  receiver.roomId || receiver.contactId

    if (this.id) {
      if (mentionIdList && mentionIdList.length > 0) {
        await this.room.atRoomMember(this.id, contactIdOrRoomId!, mentionIdList.join(','), text)
      } else {
        await this.message.sendMessage(this.id, contactIdOrRoomId!, text, MacproMessageType.Text)
      }
    } else {
      throw new Error('Can not get the logined account id')
    }

  }

  public async messageSendFile (
    receiver : Receiver,
    file     : FileBox,
  ): Promise<void> {
    log.verbose(PRE, 'messageSendFile(%s, %s)', receiver, file)

    const contactIdOrRoomId =  receiver.roomId || receiver.contactId

    const fileUrl = await this.generatorFileUrl(file)
    log.silly(PRE, `file url : ${util.inspect(fileUrl)}`)
    // this needs to run before mimeType is available
    await file.ready()

    const type = (file.mimeType && file.mimeType !== 'application/octet-stream')
      ? file.mimeType
      : path.extname(file.name)

    if (!this.id) {
      throw NoIDError('messageSendFile()')
    }

    log.silly(PRE, `fileType ${type}`)
    switch (type) {
      case '.slk':
        throw new Error('not support')
      case 'image/jpeg':
      case 'image/png':
      case '.jpg':
      case '.jpeg':
      case '.png':
        await this.message.sendMessage(this.id, contactIdOrRoomId!, fileUrl, MacproMessageType.Image)
        break
      case '.mp4':
        await this.message.sendMessage(this.id, contactIdOrRoomId!, fileUrl, MacproMessageType.Video)
        break
      default:
        await this.message.sendMessage(this.id, contactIdOrRoomId!, fileUrl, MacproMessageType.File, file.name)
        break
    }

  }

  private async generatorFileUrl (file: FileBox): Promise<string> {
    log.verbose(PRE, 'generatorFileUrl(%s)', file)
    const url = await this.requestClient.uploadFile(file.name, await file.toStream())
    return url
  }

  public async messageSendUrl (
    to: Receiver,
    urlLinkPayload: UrlLinkPayload
  ) : Promise<void> {
    log.verbose(PRE, 'messageSendUrl("%s", %s)',
      JSON.stringify(to),
      JSON.stringify(urlLinkPayload),
    )

    const contactIdOrRoomId =  to.roomId || to.contactId

    const { url, title, description } = urlLinkPayload

    if (!this.id) {
      throw NoIDError(`messageSendUrl()`)
    }
    await this.message.sendUrlLink(this.id, contactIdOrRoomId!, url, title, description)
  }

  public async messageRawPayload (id: string): Promise<MacproMessagePayload> {
    log.verbose(PRE, 'messageRawPayload(%s)', id)

    const rawPayload = this.cacheMacproMessagePayload.get(id)
    if (!rawPayload) {
      throw new Error('no rawPayload')
    }

    return rawPayload
  }

  public async messageRawPayloadParser (rawPayload: MacproMessagePayload): Promise<MessagePayload> {
    log.verbose(PRE, 'messagePayload(%s)', rawPayload)

    const payload = await messageRawPayloadParser(rawPayload)

    return payload
  }

  private async onMacproMessageFriendshipEvent (rawPayload: MacproMessagePayload): Promise<boolean> {
    log.verbose(PRE, 'onMacproMessageFriendshipEvent({id=%s})', rawPayload.messageId)
    /**
     * 1. Look for friendship confirm event
     */
    const confirmPayload = friendshipConfirmEventMessageParser(rawPayload)
    /**
     * 2. Look for friendship verify event
     */
    const verifyPayload = friendshipVerifyEventMessageParser(rawPayload)

    if (confirmPayload || verifyPayload) {
      const payload = confirmPayload || verifyPayload
      if (this.cacheManager) {
        await this.cacheManager.setFriendshipRawPayload(rawPayload.messageId, payload!)
        this.emit('friendship', rawPayload.messageId)
        return true
      }
    }
    return false
  }

  private async onMacproMessageRoomEventJoin (rawPayload: MacproMessagePayload): Promise<boolean> {
    log.verbose(PRE, 'onMacproMessageRoomEventJoin({id=%s})', rawPayload.messageId)

    const roomJoinEvent = await roomJoinEventMessageParser(rawPayload)

    if (roomJoinEvent) {
      const inviteeNameList = roomJoinEvent.inviteeNameList
      const inviterName     = roomJoinEvent.inviterName
      const roomId          = roomJoinEvent.roomId
      const timestamp       = roomJoinEvent.timestamp
      log.silly(PRE, 'onMacproMessageRoomEventJoin() roomJoinEvent="%s"', JSON.stringify(roomJoinEvent))

      const inviteeIdList = await retry(async (retryException, attempt) => {
        log.verbose(PRE, 'onMacproMessageRoomEventJoin({id=%s}) roomJoin retry(attempt=%d)', attempt)

        const tryIdList = flatten<string>(
          await Promise.all(
            inviteeNameList.map(
              inviteeName => this.roomMemberSearch(roomId, inviteeName),
            ),
          ),
        )

        if (tryIdList.length) {
          return tryIdList
        }

        /**
         * Set Cache Dirty
         */
        await this.roomMemberPayloadDirty(roomId)

        return retryException(new Error('roomMemberSearch() not found'))

      }).catch(e => {
        log.verbose(PRE, 'onMacproMessageRoomEventJoin({id=%s}) roomJoin retry() fail: %s', e.message)
        return [] as string[]
      })

      const inviterIdList = await this.roomMemberSearch(roomId, inviterName)

      if (inviterIdList.length < 1) {
        throw new Error('no inviterId found')
      } else if (inviterIdList.length > 1) {
        log.verbose(PRE, 'onMacproMessageRoomEventJoin() inviterId found more than 1, use the first one.')
      }

      const inviterId = inviterIdList[0]

      /**
       * Set Cache Dirty
       */
      await this.roomMemberPayloadDirty(roomId)
      await this.roomPayloadDirty(roomId)

      this.emit('room-join', roomId, inviteeIdList,  inviterId, timestamp)
      return true
    }
    return false
  }

  private async onMacproMessageRoomEventLeave (rawPayload: MacproMessagePayload): Promise<boolean> {
    log.verbose(PRE, 'onMacproMessageRoomEventLeave({id=%s})', rawPayload.messageId)

    const roomLeaveEvent = roomLeaveEventMessageParser(rawPayload)

    if (roomLeaveEvent) {
      const leaverNameList = roomLeaveEvent.leaverNameList
      const removerName    = roomLeaveEvent.removerName
      const roomId         = roomLeaveEvent.roomId
      const timestamp      = roomLeaveEvent.timestamp
      log.silly(PRE, 'onMacproMessageRoomEventLeave() roomLeaveEvent="%s"', JSON.stringify(roomLeaveEvent))

      const leaverIdList = flatten<string>(
        await Promise.all(
          leaverNameList.map(
            leaverName => this.roomMemberSearch(roomId, leaverName),
          ),
        ),
      )
      const removerIdList = await this.roomMemberSearch(roomId, removerName)
      if (removerIdList.length < 1) {
        throw new Error('no removerId found')
      } else if (removerIdList.length > 1) {
        log.verbose(PRE, 'onMacproMessageRoomEventLeave(): removerId found more than 1, use the first one.')
      }
      const removerId = removerIdList[0]

      /**
       * Set Cache Dirty
       */
      await this.roomMemberPayloadDirty(roomId)
      await this.roomPayloadDirty(roomId)

      this.emit('room-leave', roomId, leaverIdList, removerId, timestamp)
      return true
    }
    return false
  }

  private async onMacproMessageRoomEventTopic (rawPayload: MacproMessagePayload): Promise<boolean> {
    log.verbose(PRE, 'onMacproMessageRoomEventTopic({id=%s})', rawPayload.messageId)

    const roomTopicEvent = roomTopicEventMessageParser(rawPayload)

    if (roomTopicEvent) {
      const changerName = roomTopicEvent.changerName
      const newTopic    = roomTopicEvent.topic
      const roomId      = roomTopicEvent.roomId
      const timestamp   = roomTopicEvent.timestamp
      log.silly(PRE, 'onMacproMessageRoomEventTopic() roomTopicEvent="%s"', JSON.stringify(roomTopicEvent))

      const roomOldPayload = await this.roomPayload(roomId)
      const oldTopic       = roomOldPayload.topic

      const changerIdList = await this.roomMemberSearch(roomId, changerName)
      if (changerIdList.length < 1) {
        throw new Error('no changerId found')
      } else if (changerIdList.length > 1) {
        log.verbose(PRE, 'onMacproMessageRoomEventTopic() changerId found more than 1, use the first one.')
      }
      const changerId = changerIdList[0]

      /**
       * Set Cache Dirty
       */
      await this.roomPayloadDirty(roomId)

      this.emit('room-topic', roomId, newTopic, oldTopic, changerId, timestamp)
      return true
    }
    return false
  }

  public async messageSendContact (
    receiver  : Receiver,
    contactId : string,
  ): Promise<void> {
    log.verbose(PRE, 'messageSend("%s", %s)', util.inspect(receiver), contactId)

    if (!this.id) {
      throw NoIDError('messageSendContact()')
    }

    const contactIdOrRoomId =  receiver.roomId || receiver.contactId
    await this.message.sendContact(this.id, contactIdOrRoomId!, contactId)
  }

  // 发送小程序
  public async messageSendMiniProgram (
    receiver: Receiver,
    miniProgramPayload: MiniProgramPayload,
  ): Promise<void> {
    log.verbose(PRE, 'messageSendMiniProgram()')

    if (!this.id) {
      throw NoIDError('messageSendMiniProgram()')
    }
    const contactIdOrRoomId =  receiver.roomId || receiver.contactId
    const {
      username, // 小程序ID
      // appid, // 小程序关联的微信公众号ID  暂时不知道做啥用
      title,
      pagepath,
      description,
      thumbnailurl,
    } = miniProgramPayload

    const _miniProgram: MiniProgram = {
      app_name: username!,
      describe: description,
      my_account: this.id,
      page_path: pagepath,
      thumb_key: '',
      thumb_url: thumbnailurl,
      title: title!,
      to_account: contactIdOrRoomId!,
    }
    await this.message.sendMiniProgram(_miniProgram)
  }

  // TODO: 消息转发
  public async messageForward (
    receiver  : Receiver,
    messageId : string,
  ): Promise<void> {
    log.verbose(PRE, 'messageForward(%s, %s)',
      receiver,
      messageId,
    )

    const payload = await this.messagePayload(messageId)

    if (payload.type === MessageType.Text) {
      if (!payload.text) {
        throw new Error('no text')
      }
      await this.messageSendText(
        receiver,
        payload.text,
      )
    } else if (payload.type === MessageType.Audio) {
      throw new Error(`not support`)
    } else if (payload.type === MessageType.Url) {
      // TODO: currently this strips out the app information
      await this.messageSendUrl(
        receiver,
        await this.messageUrl(messageId)
      )
    } else if (payload.type === MessageType.MiniProgram) {
      // TODO: currently this strips out the app information
      await this.messageSendMiniProgram(
        receiver,
        await this.messageMiniProgram(messageId)
      )
    } else if (payload.type === MessageType.Video) {
      throw new Error(`not support`)
    } else if (
      payload.type === MessageType.Attachment
      || payload.type === MessageType.ChatHistory
    ) {
      throw new Error(`not support`)
    } else {
      await this.messageSendFile(
        receiver,
        await this.messageFile(messageId),
      )
    }
  }

  // TODO: 转发小程序
  public async messageMiniProgram (messageId: string)  : Promise<MiniProgramPayload> {
    log.verbose(PRE, 'messageUrl(%s)', messageId)

    return {
      title : 'Macpro title for ' + messageId,
      username: '',
    }
  }

  public async messageFile (id: string): Promise<FileBox> {
    if (!this.cacheManager) {
      throw new Error(`Can not get filebox from message since no cache manager.`)
    }
    const messagePayload = this.cacheMacproMessagePayload.get(id)
    if (!messagePayload) {
      throw new Error(`Can not get filebox from message since no message for id: ${id}.`)
    }
    const messageType = messagePayload.content_type
    const supportedMessageTypeToFileBox = [
      MacproMessageType.File,
      MacproMessageType.Image,
      MacproMessageType.Video,
      MacproMessageType.Voice,
    ]
    if (supportedMessageTypeToFileBox.includes(messageType)) {
      const fileBox = FileBox.fromUrl(messagePayload.content)
      if (messageType === MacproMessageType.Voice) {
        fileBox.metadata = {
          voiceLength: messagePayload.voice_len,
        }
      }
      return fileBox
    } else {
      throw new Error(`Can not get filebox for message type: ${MacproMessageType[messageType]}`)
    }
  }

  // TODO: 转发UrlLink
  public async messageUrl (messageId: string)  : Promise<UrlLinkPayload> {
    log.verbose(PRE, 'messageUrl(%s)')

    const payload = this.cacheMacproMessagePayload.get(messageId)
    if (!payload) {
      throw new Error(`Can not get url from message, since there is no message with id: ${messageId}`)
    }
    const urlLinkPayload = messageUrlPayloadParser(payload)

    if (!urlLinkPayload) {
      throw new Error(`Parse url link from message failed.`)
    }

    return urlLinkPayload
  }

  /**
   *
   * Room
   *
   */
  public async roomRawPayload (
    id: string,
  ): Promise<MacproRoomPayload> {
    log.verbose(PRE, 'roomRawPayload(%s)', id)

    if (!this.cacheManager) {
      throw CacheManageError('roomRawPayload()')
    }

    let rawPayload = await this.cacheManager.getRoom(id)

    if (!rawPayload) {
      if (!this.id) {
        throw NoIDError(`roomRawPayload()`)
      }
      const roomDetail = await this.room.roomDetailInfo(this.id, id)
      if (roomDetail) {
        rawPayload = await this.roomInfoConvert(roomDetail)
      } else {
        throw new Error(`no payload`)
      }
    }

    return rawPayload
  }

  private async roomInfoConvert (roomDetail: GrpcRoomDetailInfo): Promise<MacproRoomPayload> {
    log.silly(PRE, `roomInfoConvert() room detail : ${util.inspect(roomDetail)}`)

    const _members: GrpcRoomMember[] = roomDetail.data
    const members: MacproRoomMemberPayload[] = []
    _members.map(m => {
      const member: MacproRoomMemberPayload = {
        account: m.account,
        accountAlias: m.account_alias,
        area: m.area,
        description: m.description,
        disturb: '',
        formName: m.my_name,
        name: m.name,
        sex: m.sex as ContactGender,
        thumb: m.thumb,
        v1: '',
      }
      members.push(member)
    })
    const roomPayload: MacproRoomPayload = {
      disturb: roomDetail.disturb,
      members,
      name: roomDetail.name,
      number: roomDetail.number,
      owner: roomDetail.author,
      thumb: roomDetail.thumb,
    }
    // TODO: convert data from grpc to macpro
    return roomPayload
  }

  public async roomRawPayloadParser (
    rawPayload: MacproRoomPayload,
  ): Promise<RoomPayload> {
    log.verbose(PRE, 'roomRawPayloadParser(%s)', rawPayload)

    const payload: RoomPayload = {
      avatar: rawPayload.thumb,
      id : rawPayload.number,
      memberIdList : rawPayload.members.map(m => m.account) || [],
      ownerId: rawPayload.owner,
      topic: rawPayload.name,
    }

    return payload
  }

  public async roomList (): Promise<string[]> {
    log.verbose(PRE, 'roomList()')

    if (!this.cacheManager) {
      throw CacheManageError(`roomList()`)
    }
    const roomIdList = await this.cacheManager.getRoomIds()
    log.verbose(PRE, `roomList() length = ${roomIdList.length}`)

    return roomIdList
  }

  public async roomAvatar (roomId: string): Promise<FileBox> {
    log.verbose(PRE, 'roomAvatar(%s)', roomId)

    const payload = await this.roomPayload(roomId)

    if (payload.avatar) {
      return FileBox.fromUrl(payload.avatar)
    }
    log.warn(PRE, 'roomAvatar() avatar not found, use the chatie default.')
    return qrCodeForChatie()
  }

  public async roomTopic (roomId: string)                : Promise<string>
  public async roomTopic (roomId: string, topic: string) : Promise<void>

  public async roomTopic (
    roomId: string,
    topic?: string,
  ): Promise<void | string> {
    log.verbose(PRE, 'roomTopic(%s, %s)', roomId, topic)

    if (!this.id) {
      throw NoIDError('roomTopic()')
    }
    if (topic) {
      await this.room.modifyRoomTopic(this.id, roomId, topic)

      if (!this.cacheManager) {
        throw CacheManageError('roomTopic()')
      }
      const room = await this.cacheManager.getRoom(roomId)
      if (!room) {
        throw new Error(`can not get room from cache by room id: ${roomId}.`)
      }
      room.name = topic
      await this.cacheManager.setRoom(roomId, room)
    } else {
      if (!this.cacheManager) {
        throw CacheManageError('roomTopic()')
      }

      const roomPayload = await this.cacheManager.getRoom(roomId)
      if (!roomPayload) {
        throw new Error(`can not get room from cache by room id: ${roomId}.`)
      }
      return roomPayload.name
    }

  }

  public async roomCreate (
    contactIdList: string[],
    topic?: string,
  ): Promise<string> {
    log.verbose(PRE, 'roomCreate(%s, %s)', contactIdList, topic)

    if (!this.id) {
      throw NoIDError('roomCreate()')
    }
    await this.room.createRoom(this.id, contactIdList)

    await this.grpcGateway.on('room-create', async data => {
      const roomCreate: MacproCreateRoom = JSON.parse(data)
      const roomId = roomCreate.account

      if (!this.id) {
        throw NoIDError('roomCreate()')
      }
      if (topic) {
        await this.room.modifyRoomTopic(this.id, roomId, topic)
      }
      return roomId
    })

    log.silly(PRE, `can not get room id, bcz no room-create event happened.`)
    throw new Error(`can not get room id, bcz no room-create event happened.`)
  }

  public async roomAdd (
    roomId    : string,
    contactId : string,
  ): Promise<void> {
    log.verbose(PRE, 'roomAdd(%s, %s)', roomId, contactId)

    if (!this.id) {
      throw NoIDError('roomAdd()')
    }
    const accountId = await this.getAccountId(contactId)
    if (accountId === '') {
      throw new Error(`can not find contact by id: ${contactId}`)
    }
    const res = await this.room.roomAdd(this.id, roomId, accountId)

    if (res === RequestStatus.Fail) {
      await this.room.roomInvite(this.id, roomId, accountId)
    }

  }

  private async getAccountId (id: string): Promise<string> {
    if (!this.cacheManager) {
      throw CacheManageError('getAccountId()')
    }
    const contact = await this.cacheManager.getContact(id)
    if (contact) {
      const accountId = contact.account
      return accountId
    } else {
      const wxid = await this.cacheManager.getAccountWXID(id)
      if (!wxid) {
        return id
      } else {
        return ''
      }
    }
  }

  public async roomDel (
    roomId    : string,
    contactId : string,
  ): Promise<void> {
    log.verbose(PRE, 'roomDel(%s, %s)', roomId, contactId)

    if (!this.id) {
      throw NoIDError('roomDel()')
    }
    const accountId = await this.getAccountId(contactId)
    if (accountId === '') {
      throw new Error(`can not find contact by id: ${contactId}`)
    }
    await this.room.roomDel(this.id, roomId, accountId)
  }

  public async roomQuit (roomId: string): Promise<void> {
    log.verbose(PRE, 'roomQuit(%s)', roomId)

    if (!this.id) {
      throw NoIDError('roomQuit()')
    }
    await this.room.roomQuit(this.id, roomId)
  }

  public async roomQrcode (roomId: string): Promise<string> {
    log.verbose(PRE, 'roomQrcode(%s)', roomId)

    if (!this.id) {
      throw NoIDError('roomQrcode()')
    }
    await this.room.roomQrcode(this.id, roomId)

    // TODO: 需要将监听函数存入数组
    const qrcode = await new Promise<string>((resolve) => {
      this.grpcGateway.on('room-qrcode', (data: string) => {
        const _data: GrpcRoomQrcode = JSON.parse(data)
        log.silly(PRE, `room-qrcode : ${util.inspect(_data)}`)
        resolve(_data.qrcode)
      })
    })
    return qrcode
  }

  public async roomMemberList (roomId: string) : Promise<string[]> {
    log.verbose(PRE, 'roommemberList(%s)', roomId)

    if (!this.cacheManager) {
      throw CacheManageError('roomMemberList()')
    }

    const roomMemberListPayload = await this.cacheManager.getRoomMember(roomId)
    if (roomMemberListPayload === undefined) {
      // TODO: get room member from grpc here
      throw new Error(`can not find this room member by room id: ${roomId}`)
    }
    return Object.keys(roomMemberListPayload)
  }

  public async roomMemberRawPayload (roomId: string, contactId: string): Promise<MacproRoomMemberPayload>  {
    log.verbose(PRE, 'roomMemberRawPayload(%s, %s)', roomId, contactId)

    if (!this.cacheManager) {
      throw CacheManageError('roomMemberRawPayload()')
    }
    const roomMemberListPayload = await this.cacheManager.getRoomMember(roomId)
    if (roomMemberListPayload === undefined) {
      throw new Error(`can not find this room member by room id: ${roomId}`)
    }
    return roomMemberListPayload[contactId]
  }

  public async roomMemberRawPayloadParser (rawPayload: GrpcRoomMemberPayload): Promise<RoomMemberPayload>  {
    log.verbose(PRE, 'roomMemberRawPayloadParser(%s)', rawPayload)

    const payload: RoomMemberPayload = {
      avatar: rawPayload.bigHeadImgUrl,
      id: rawPayload.userName,
      // inviterId: ??
      name: rawPayload.nickName,
      roomAlias: rawPayload.displayName,
    }

    return payload
  }

  public async roomAnnounce (roomId: string)                : Promise<string>
  public async roomAnnounce (roomId: string, text: string)  : Promise<void>

  public async roomAnnounce (roomId: string, text?: string) : Promise<void | string> {
    log.silly(PRE, `room id: ${roomId}, text: ${text}`)
    throw new Error(`not support`)
  }

  /**
   *
   * Room Invitation
   *
   */
  public async roomInvitationAccept (roomInvitationId: string): Promise<void> {
    log.verbose(PRE, 'roomInvitationAccept(%s)', roomInvitationId)
    throw new Error(`not support`)
  }

  public async roomInvitationRawPayload (roomInvitationId: string): Promise<MacproRoomInvitationPayload> {
    log.verbose(PRE, `roomInvitationRawPayload(${roomInvitationId})`)

    if (!this.cacheManager) {
      throw new Error('no cache')
    }

    const payload = await this.cacheManager.getRoomInvitation(roomInvitationId)

    if (payload) {
      return payload
    } else {
      throw new Error(`can not get invitation with invitation id: ${roomInvitationId}`)
    }
  }

  public async roomInvitationRawPayloadParser (rawPayload: MacproRoomInvitationPayload): Promise<RoomInvitationPayload> {
    log.verbose(PRE, `roomInvitationRawPayloadDirty(${rawPayload})`)
    return {
      id: rawPayload.id,
      inviterId: rawPayload.fromUser,
      roomMemberCount: 0,
      roomMemberIdList: [],
      roomTopic: rawPayload.roomName,
      timestamp: rawPayload.timestamp,
    }
  }

  /**
   *
   * Friendship
   *
   */
  public async friendshipRawPayload (friendshipId: string): Promise<FriendshipPayload> {
    if (!this.cacheManager) {
      throw new Error(`cache manager is not available, can not get friendship raw payload.`)
    }
    const rawPayload = await this.cacheManager.getFriendshipRawPayload(friendshipId)
    if (!rawPayload) {
      throw new Error(`no rawPayload for id ${friendshipId}`)
    }
    return rawPayload
  }

  public async friendshipRawPayloadParser (
    rawPayload: FriendshipPayload
  ) : Promise<FriendshipPayload> {
    return rawPayload
  }

  public async friendshipAdd (
    contactId : string,
    hello     : string,
  ): Promise<void> {
    log.verbose(PRE, 'friendshipAdd(%s, %s)', contactId, hello)

    if (!this.id) {
      throw NoIDError('friendshipAdd()')
    }
    if (!this.cacheManager) {
      throw CacheManageError('friendshipAdd()')
    }
    const contact = await this.cacheManager.getContact(contactId)

    if (contact) {
      await this.user.addFriend(this.id, contact.account, hello)
    } else {
      await this.user.addFriend(this.id, contactId, hello)
    }
  }

  public async friendshipAccept (
    friendshipId : string,
  ): Promise<void> {
    log.verbose(PRE, 'friendshipAccept(%s)', friendshipId)

    if (!this.cacheManager) {
      throw CacheManageError('friendshipAccept()')
    }
    const friendshipPayload = await this.cacheManager.getFriendshipRawPayload(friendshipId)
    if (!friendshipPayload) {
      log.warn(`Can not find friendship payload, not able to accept friendship.`)
      return
    }
    if (!this.id) {
      throw NoIDError('friendshipAccept()')
    }
    await this.user.acceptFriend(this.id, friendshipPayload.contactId)
  }

  public ding (data?: string): void {
    log.silly(PRE, 'ding(%s)', data || '')
    this.emit('dong', data)
  }

  public unref (): void {
    log.verbose(PRE, 'unref()')
    super.unref()
    if (this.loopTimer) {
      this.loopTimer.unref()
    }
  }

}

export default PuppetMacpro
