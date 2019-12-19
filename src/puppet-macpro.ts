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

import { ThrottleQueue, DelayQueueExecutor } from 'rx-queue'

import {
  GrpcPrivateMessagePayload,
  MacproMessageType,
  MiniProgram,
  RequestStatus,
  GrpcFriendshipRawPayload,
  GrpcPublicMessagePayload,
  GrpcLoginInfo,
  MacproMessagePayload,
  AddFriendBeforeAccept,
  MacproFriendInfo,
  MacproUrlLink,
} from './schemas'

import { RequestClient } from './utils/request'
import { CacheManageError } from './utils/errorMsg'
import { MacproContactPayload, ContactList, GrpcContactPayload, AliasModel, GrpcContactInfo } from './schemas/contact'
import { CacheManager } from './cache-manager'
import { GrpcGateway } from './gateway/grpc-api'
import MacproContact from './mac-api/contact'
import MacproUser from './mac-api/user'
import MacproMessage from './mac-api/message'
import { MacproRoomPayload, GrpcRoomMemberPayload, MacproRoomInvitationPayload, MacproCreateRoom, GrpcRoomQrcode, MacproRoomMemberPayload, GrpcRoomJoin, RoomChangeState, GrpcSyncRoomListBox, GrpcSyncRoomList, GrpcRoomPayload } from './schemas/room'
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
const MEMORY_SLOT_NAME = 'WECHATY_PUPPET_MACPRO'

export interface MacproMemorySlot {
  taskId   : string,
  userName : string,
  wxid     : string,
}

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

  private token: string

  private apiQueue: DelayQueueExecutor

  private memorySlot: MacproMemorySlot

  private addFriendCB: {[id: string]: any} = {}

  private reconnectThrottleQueue: ThrottleQueue

  private loginStatus: boolean

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
    this.loginStatus = false
    this.cacheMacproMessagePayload = new LRU<string, MacproMessagePayload>(lruOptions)

    this.memorySlot = {
      taskId: '',
      userName: '',
      wxid: '',
    }

    this.token = options.token || macproToken()
    if (this.token) {
      this.grpcGateway = new GrpcGateway(this.token, GRPC_ENDPOINT)
      this.requestClient = new RequestClient(this.grpcGateway)
      this.contact = new MacproContact(this.requestClient)
      this.user = new MacproUser(this.token, this.requestClient)
      this.message = new MacproMessage(this.requestClient)
      this.room = new MacproRoom(this.requestClient)

      const max = 0.05
      const min = 0.03
      this.apiQueue = new DelayQueueExecutor(Math.max(min, Math.random() * max) * 1000)

      this.reconnectThrottleQueue = new ThrottleQueue<string>(5000)
      this.reconnectThrottleQueue.subscribe(async reason => {
        log.silly('Puppet', 'constructor() reconnectThrottleQueue.subscribe() reason: %s', reason)
        if (this.grpcGateway) {
          this.grpcGateway.removeAllListeners()
        }
        delete this.requestClient
        delete this.contact
        delete this.user
        delete this.message
        delete this.room

        await this.start()
      })
    } else {
      log.error(PRE, `can not get token info from options for start grpc gateway.`)
      throw new Error(`can not get token info.`)
    }
  }

  public async start (): Promise<void> {
    log.silly(PRE, `start()`)

    this.state.on('pending')

    try {
      this.grpcGateway = new GrpcGateway(this.token, GRPC_ENDPOINT)
      await this.grpcGateway.notify('getLoginUserInfo')
    } catch (error) {
      log.info(`start grpc gateway failed for reason: ${error}, retry start in 5 seconds.`)
      await new Promise(resolve => setTimeout(resolve, 5000))
      await this.start()
      return
    }

    await this.startGrpcListener()

    this.requestClient = new RequestClient(this.grpcGateway)
    this.contact = new MacproContact(this.requestClient)
    this.user = new MacproUser(this.token, this.requestClient)
    this.message = new MacproMessage(this.requestClient)
    this.room = new MacproRoom(this.requestClient)

    this.state.on(true)
  }

  private async startGrpcListener () {
    this.grpcGateway.on('reconnect', async () => {
      this.reconnectThrottleQueue.next('reconnect')
    })

    this.grpcGateway.on('heartbeat', async () => {
      this.emit('watchdog', {
        data: 'heartbeat',
      })
    })

    this.grpcGateway.on('scan', async (dataStr: string) => {
      const data = JSON.parse(dataStr)
      if (data && data.status) {
        this.emit('scan', '', data.status)
      } else {

        const fileBox = FileBox.fromUrl(data.url)
        const url = await fileBoxToQrcode(fileBox)
        this.emit('scan', url, ScanStatus.Cancel)
      }
    })

    this.grpcGateway.on('login', async dataStr => {
      log.info(PRE, `
      ======================================
                 LOGIN SUCCESS
      ======================================
      `)
      const data: GrpcLoginInfo = JSON.parse(dataStr)
      const account = data.account

      log.verbose(PRE, `init cache manager`)
      await CacheManager.init(account)
      this.cacheManager = CacheManager.Instance

      const selfPayload: MacproContactPayload = {
        account: data.account,
        accountAlias: data.account_alias || data.account, // wxid
        city: '',
        description: '',
        disturb: '',
        formName: '',
        name: data.name,
        province: '',
        sex: ContactGender.Unknown,
        thumb: data.thumb,
        v1: '',
      }
      await this.cacheManager.setContact(selfPayload.accountAlias, selfPayload)

      if (!this.loginStatus) {
        await super.login(selfPayload.accountAlias)
      }
      this.loginStatus = true

      if (this.memory) {
        this.memorySlot = {
          taskId: data.task_id,
          userName: data.account,
          wxid: data.account_alias,
        }
        await this.memory.set(MEMORY_SLOT_NAME, this.memorySlot)
        await this.memory.save()
      }

      await this.login(account)

    })

    this.grpcGateway.on('logout', async () => {
      log.info(PRE, `
      ======================================
                 LOGOUT SUCCESS
      ======================================
      `)
      this.emit('logout', this.selfId()) // TODO: need to emit logout event to wechaty
      this.emit('reset', 'reset when received logout event.')
    })

    this.grpcGateway.on('not-login', async (dataStr: string) => {
      log.verbose(PRE, `
      ======================================
               grpc on not-login
      ======================================
      `)
      if (this.memory) {
        const slot = await this.memory.get(MEMORY_SLOT_NAME)
        if (slot && slot.userName) {
          log.silly(PRE, `slot : ${slot.userName}, data str : ${dataStr}`)
          await this.user.getWeChatQRCode(slot.userName)
        } else {
          await this.user.getWeChatQRCode()
        }
      } else {
        await this.user.getWeChatQRCode()
      }
    })

    this.grpcGateway.on('message', data => this.onProcessMessage(JSON.parse(data)))

    this.grpcGateway.on('contact-list', data => this.syncContactList(data))

    this.grpcGateway.on('room-list', data => this.syncRoomList(data))

    this.grpcGateway.on('contact-info', data => this.syncContactInfo(data))

    this.grpcGateway.on('room-info', data => this.syncRoomInfo(data))

    this.grpcGateway.on('room-qrcode', (data: string) => {
      const _data: GrpcRoomQrcode = JSON.parse(data)
      log.silly(PRE, `room-qrcode : ${util.inspect(_data)}`)
      this.room.resolveRoomQrcodeCallback(_data.group_number, _data.qrcode)
    })

    this.grpcGateway.on('room-join', async (data: string) => {
      const _data: GrpcRoomJoin = JSON.parse(data)
      log.silly(PRE, `room change info : ${util.inspect(_data)}`)

      if (!this.cacheManager) {
        throw new Error(`no cacheManager`)
      }
      const roomId = _data.g_number
      const roomMembers = await this.cacheManager.getRoomMember(roomId)
      if (!roomMembers && _data.type === RoomChangeState.JOIN) {
        await this.room.syncRoomDetailInfo(this.selfId(), _data.g_number)
      }
      if (roomMembers && _data.type === RoomChangeState.JOIN) {
        let memberPayload: MacproRoomMemberPayload
        if (roomMembers[_data.account]) {
          memberPayload = roomMembers[_data.account]
          memberPayload.account = _data.account
          memberPayload.name = _data.name
        } else {
          memberPayload = {
            account: _data.account,
            accountAlias: _data.account,
            city: '',
            description: '',
            disturb: '',
            formName: '',
            name: _data.name,
            province: '',
            sex: ContactGender.Unknown,
            thumb: '',
            v1: '',
          }
        }
        roomMembers[_data.account] = memberPayload
        await this.cacheManager.setRoomMember(roomId, roomMembers)
        const _contact = await this.cacheManager.getContact(_data.account)
        if (!_contact) {
          const contact: MacproContactPayload = {
            account: _data.account,
            accountAlias: _data.account,
            city: '',
            description: '',
            disturb: '',
            formName: '',
            name: _data.name,
            province: '',
            sex: ContactGender.Unknown,
            thumb: '',
            v1: '',
          }
          await this.cacheManager.setContact(_data.account, contact)
        }
      }
      // TODO: can not get room member account when the member been removed by bot, account = ''
      /* if (roomMembers && _data.type === RoomChangeState.LEAVE) {
        const wxid = await this.getAccountId(_data.account)
        if (wxid === _data.my_account) { // if the bot been removed from this room, we should clear the cache of Room and RoomMember
          setTimeout(async () => {
            if (!this.cacheManager) {
              throw new Error(`no cacheManager`)
            }
            await this.cacheManager.deleteRoom(roomId)
            await this.cacheManager.deleteRoomMember(roomId)
          }, 5000)
        } else {
          const members = await this.cacheManager.getRoomMember(roomId)
          if (members) {
            delete members[_data.account]
            await this.cacheManager.setRoomMember(roomId, members)
          }
        }
      } */
    })

    this.grpcGateway.on('room-member', async memberStr => {
      const members: GrpcRoomMemberPayload[] = JSON.parse(memberStr).memberList
      const macproMembers: MacproRoomMemberPayload[] = []
      let payload: { [contactId: string]: MacproRoomMemberPayload } = {}
      members.map(async member => {
        if (member.userName) {
          const roomMemberPayload: MacproRoomMemberPayload = {
            account: member.userName,
            accountAlias: member.userName,
            city: '',
            description: '',
            disturb: '',
            formName: member.displayName,
            name: member.nickName,
            province: '',
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
              account: member.userName,
              accountAlias: member.userName,
              city: '',
              description: '',
              disturb: '',
              formName: member.displayName,
              name: member.nickName,
              province: '',
              sex: ContactGender.Unknown,
              thumb: member.bigHeadImgUrl,
              v1: '',
            }
            await this.cacheManager.setContact(member.userName, contact)
          }
          await this.cacheManager.setRoomMember(member.number, payload)
        } else {
          log.silly(PRE, `can not get member user name`)
        }
      })

      this.room.resolveRoomMemberCallback(members[0] && members[0].number, macproMembers)
    })

    this.grpcGateway.on('new-friend', async (dataStr: string) => {
      // Friend request => Bot, Bot has not accepted
      const friendshipRawPayload: GrpcFriendshipRawPayload = JSON.parse(dataStr)
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

    this.grpcGateway.on('add-friend', async (dataStr: string) => {
      // Friend request => Contact, Contact has accepted
      log.silly(PRE, `add-friend data : ${dataStr}`)
      const newContactBox = JSON.parse(dataStr)
      const newContact = JSON.parse(newContactBox.data)
      const contact: MacproContactPayload = {
        account: newContact.account,
        accountAlias: newContact.account_alias || newContact.account,
        city: newContact.area ? newContact.area.split('_')[1] : '',
        description: '',
        disturb: '',
        formName: '',
        name: newContact.name,
        province: newContact.area ? newContact.area.split('_')[0] : '',
        sex: Number(newContact.sex) as ContactGender,
        thumb: newContact.thumb,
        v1: newContact.v1,
      }
      if (this.cacheManager) {
        await this.cacheManager.setContact(contact.accountAlias, contact)
      }
    })

    this.grpcGateway.on('del-friend', async (dataStr: string) => {
      // Bot delete Contact by WeChat App
      log.silly(PRE, `del-friend : ${dataStr}`)
      // TODO: need to remove contact from cache
    })

    this.grpcGateway.on('add-friend-before-accept', (dataStr: string) => {
      // Friend request => Contact, Contact has not accepted
      log.silly(PRE, `add-friend-before-accept data : ${dataStr}`) // to_account -> WeChat account

      const data: AddFriendBeforeAccept = JSON.parse(dataStr)
      const phoneOrAccount = data.phone || data.to_name

      const unique = this.selfId() + phoneOrAccount
      const cb = this.addFriendCB[unique]
      if (cb) {
        const friendInfo: MacproFriendInfo = {
          friendAccount: data.to_name,
          friendPhone: data.phone,
          friendThumb: data.to_thumb,
          myAccount: data.my_account,
        }
        cb(friendInfo)
      }
    })
  }

  protected async login (selfId: string): Promise<void> {
    log.verbose(PRE, `login success, loading contact and room data.`)

    const contactStatus = await this.contact.contactList(selfId)
    await this.room.syncRoomList(selfId)
    if (contactStatus === RequestStatus.Fail) {
      throw new Error(`load contact list failed.`)
    }
  }

  protected async onProcessMessage (messagePayload: GrpcPrivateMessagePayload | GrpcPublicMessagePayload) {

    log.verbose(PRE, `onProcessMessage()`)
    const contentType = messagePayload.content_type

    if (!contentType) {
      const contactPayload = newFriendMessageParser(messagePayload as any)
      if (this.cacheManager && contactPayload !== null) {
        await this.cacheManager.setContact(contactPayload.account, contactPayload)
      }
      return
    }

    const messageId = uuid()

    const payload: MacproMessagePayload = {
      ...messagePayload,
      content_type: contentType,
      messageId,
      timestamp: messagePayload.send_time || (Date.now() / 1000),
    }

    this.cacheMacproMessagePayload.set(messageId, payload)

    switch (payload.content_type) {

      case MacproMessageType.Text:
        this.onMacproMessageFriendshipEvent(payload),
        this.emit('message', messageId)
        break
      case MacproMessageType.Image:
      case MacproMessageType.Voice:
      case MacproMessageType.Video:
      case MacproMessageType.File:
      case MacproMessageType.PublicCard:
      case MacproMessageType.PrivateCard:
      case MacproMessageType.UrlLink:
      case MacproMessageType.MiniProgram:
      case MacproMessageType.Gif:
        this.emit('message', messageId)
        break
      case MacproMessageType.Location:
      case MacproMessageType.RedPacket:
      case MacproMessageType.MoneyTransaction:
        this.emit('message', messageId)
        break
      case MacproMessageType.System:
        await Promise.all([
          this.onMacproMessageFriendshipEvent(payload),
          this.onMacproMessageRoomEventJoin(payload),
          this.onMacproMessageRoomEventLeave(payload),
          this.onMacproMessageRoomEventTopic(payload),
        ])
        this.emit('message', messageId)
        break
      default:
        this.emit('message', messageId)
        break
    }

  }

  public async syncContactList (data: string): Promise<void> {
    log.verbose(PRE, `syncContactList()`)

    const contactListInfo: ContactList = JSON.parse(data)
    const { currentPage, total, info } = contactListInfo

    await Promise.all(info.map(async (_contact: GrpcContactPayload) => {
      const contact: MacproContactPayload = {
        account: _contact.account,
        accountAlias: _contact.account_alias || _contact.account, // weixin and wxid are the same string
        city: _contact.area ? _contact.area.split('_')[1] : '',
        description: _contact.description,
        disturb: _contact.disturb,
        formName: _contact.form_name,
        name: _contact.name,
        province: _contact.area ? _contact.area.split('_')[0] : '',
        sex: parseInt(_contact.sex, 10) as ContactGender,
        thumb: _contact.thumb,
        v1: _contact.v1,
      }

      if (!this.cacheManager) {
        throw CacheManageError('syncContactList()')
      }
      await this.cacheManager.setContact(contact.accountAlias, contact)
    }))
    if (currentPage * 100 > total) {
      log.verbose(PRE, `contact data loaded. contact length: ${info.length}`)
    }
  }

  public async syncRoomList (data: string) {
    const _data: GrpcSyncRoomListBox = JSON.parse(data)
    const roomList: GrpcSyncRoomList[] = JSON.parse(_data.info)
    if (roomList && roomList.length === 0) {
      log.warn(`
        This is a new account which login wechaty based on Mac protocal first time,
        please add one room to Contacts or send message to one existed room for loading room data,
        and then just restart the bot again.
      `)
    }
    await Promise.all(roomList.map(async (room) => {
      if (this.cacheManager) {
        const roomPayload: MacproRoomPayload = {
          disturb: 0,
          members: [],
          name: room.name,
          number: room.number,
          owner: '',
          thumb: room.thumb,
        }
        await this.cacheManager.setRoom(room.number, roomPayload)
        await this.apiQueue.execute(async () => {
          await this.room.syncRoomDetailInfo(this.selfId(), room.number)
        })
      }
    }))
  }

  public async syncContactInfo (data: string) {
    log.verbose(PRE, `listen on contact detail info : ${data}`)
    const contactInfo: GrpcContactInfo = JSON.parse(data)
    if (this.cacheManager) {
      const callback = this.getCallback(contactInfo.username)
      const contact: MacproContactPayload = {
        account: contactInfo.alias || '',
        accountAlias: contactInfo.username || contactInfo.alias, // wxid
        city: '',
        description: contactInfo.signature || '',
        disturb: '',
        formName: '',
        name: contactInfo.nickname,
        province: '',
        sex: ContactGender.Unknown,
        thumb: contactInfo.headurl,
        v1: '',
      }
      await this.cacheManager.setContact(contact.accountAlias, contact)
      callback(contact)
      this.removeCallback(contactInfo.username)
    }
  }

  public async syncRoomInfo (data: string) {
    log.verbose(PRE, `listen on room detail info`)
    const roomDetailInfo: GrpcRoomPayload = JSON.parse(data)
    if (this.cacheManager) {
      const cacheRoom = await this.cacheManager.getRoom(roomDetailInfo.number)
      if (cacheRoom) {
        // step 1: get the owner and thumb of this room
        cacheRoom.owner = roomDetailInfo.author
        cacheRoom.thumb = roomDetailInfo.thumb
        // step 2: get the members of this room
        await this.room.roomMember(this.selfId(), roomDetailInfo.number)

        this.room.pushRoomMemberCallback(cacheRoom.number, async (macproMembers) => {
          cacheRoom.members = macproMembers
          if (!this.cacheManager) {
            throw CacheManageError('pushRoomMemberCallback()')
          }
          await this.cacheManager.setRoom(cacheRoom.number, cacheRoom)
          // step 3: resolve the room info
          this.room.resolveRoomCallback(cacheRoom.number, cacheRoom)
        })
      } else {
        const room: MacproRoomPayload = {
          disturb: 0,
          members: [],
          name: roomDetailInfo.name,
          number: roomDetailInfo.number,
          owner: roomDetailInfo.author,
          thumb: roomDetailInfo.thumb,
        }
        await this.room.roomMember(this.selfId(), roomDetailInfo.number)

        this.room.pushRoomMemberCallback(room.number, async (macproMembers) => {
          room.members = macproMembers
          if (!this.cacheManager) {
            throw CacheManageError('pushRoomMemberCallback()')
          }
          await this.cacheManager.setRoom(room.number, room)
          this.room.resolveRoomCallback(room.number, room)
        })
      }
    }
  }

  public async stop (): Promise<void> {

    log.silly(PRE, 'stop()')

    if (this.state.off()) {
      log.warn(PRE, 'stop() is called on a OFF puppet. await ready(off) and return.')
      await this.state.ready('off')
      return
    }

    this.state.off('pending')

    await CacheManager.release() // TODO: flash-store bug
    await this.grpcGateway.stop()
    this.grpcGateway.removeAllListeners()

    this.state.off(true)
  }

  public async logout (): Promise<void> {

    log.silly(PRE, 'logout()')

    await this.user.logoutWeChat(this.selfId())
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
  private poolMap: { [requestId: string]: (data: MacproContactPayload) => void } = {}
  private pushCallbackToPool (requestId: string, callback: (data: MacproContactPayload) => void) {
    this.poolMap[requestId] = callback
  }
  private getCallback (requestId: string) {
    return this.poolMap[requestId]
  }
  private removeCallback (requestId: string) {
    delete this.poolMap[requestId]
  }

  public async contactRawPayload (id: string): Promise<MacproContactPayload> {
    log.verbose(PRE, 'contactRawPayload(%s)', id)
    if (!this.cacheManager) {
      throw CacheManageError('contactRawPayload()')
    }

    let rawPayload = await this.cacheManager.getContact(id)

    if (!rawPayload) {
      await this.contact.syncContactInfo(this.selfId(), id)

      return new Promise(resolve => {
        this.pushCallbackToPool(id, (data: MacproContactPayload) => {
          resolve(data)
        })
      })
    }
    return rawPayload
  }

  public async contactRawPayloadParser (rawPayload: MacproContactPayload): Promise<ContactPayload> {
    log.verbose(PRE, 'contactRawPayloadParser()')

    const payload: ContactPayload = {
      address   : rawPayload.province + ',' + rawPayload.city,
      alias     : rawPayload.formName,
      avatar    : rawPayload.thumb,
      city      : rawPayload.city,
      friend    : isStrangerV1(rawPayload.v1),
      gender    : rawPayload.sex,
      id        : rawPayload.accountAlias,
      name      : rawPayload.name,
      province  : rawPayload.province,
      signature : rawPayload.description,
      type      : ContactType.Personal,
      weixin    : rawPayload.account,
    }
    return payload
  }

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
      const aliasModel: AliasModel = {
        contactId,
        loginedId: this.selfId(),
        remark: alias || '',
      }
      const res = await this.contact.setAlias(aliasModel)
      if (res === RequestStatus.Success) {
        if (!this.cacheManager) {
          throw new Error(`no cacheManager`)
        }
        const contact = await this.cacheManager.getContact(contactId)
        if (!contact) {
          throw new Error(`can not find contact by id : ${contactId}`)
        }
        contact.formName = alias!
        await this.cacheManager.setContact(contactId, contact)
      }
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

    if (this.selfId()) {
      if (mentionIdList && mentionIdList.length > 0) {
        await this.room.atRoomMember(this.selfId(), contactIdOrRoomId!, mentionIdList.join(','), text)
      } else {
        await this.message.sendMessage(this.selfId(), contactIdOrRoomId!, text, MacproMessageType.Text)
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

    await file.ready()

    const type = (file.mimeType && file.mimeType !== 'application/octet-stream')
      ? file.mimeType
      : path.extname(file.name)

    log.silly(PRE, `fileType : ${type}`)
    switch (type) {
      case '.slk':
        throw new Error('not support')
      case 'image/jpeg':
      case 'image/png':
      case '.jpg':
      case '.jpeg':
      case '.png':
        await this.message.sendMessage(this.selfId(), contactIdOrRoomId!, fileUrl, MacproMessageType.Image)
        break
      case '.mp4':
      case 'video/mp4':
        await this.message.sendMessage(this.selfId(), contactIdOrRoomId!, fileUrl, MacproMessageType.Video)
        break
      default:
        await this.message.sendMessage(this.selfId(), contactIdOrRoomId!, fileUrl, MacproMessageType.File, file.name)
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

    const { url, title, thumbnailUrl, description } = urlLinkPayload

    const payload: MacproUrlLink = {
      description,
      thumbnailUrl,
      title,
      url,
    }
    await this.message.sendUrlLink(this.selfId(), contactIdOrRoomId!, payload)
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
    log.verbose(PRE, 'messagePayload(%s)', JSON.stringify(rawPayload))

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
    log.silly(`roomTopicEvent : ${JSON.stringify(roomTopicEvent)}`)
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
      if (this.cacheManager) {
        const room = await this.cacheManager.getRoom(roomId)
        if (room) {
          room.name = roomTopicEvent.topic
          await this.cacheManager.setRoom(roomId, room)
        }
      }

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

    const contactIdOrRoomId =  receiver.roomId || receiver.contactId
    await this.message.sendContact(this.selfId(), contactIdOrRoomId!, contactId)
  }

  // 发送小程序
  public async messageSendMiniProgram (
    receiver: Receiver,
    miniProgramPayload: MiniProgramPayload,
  ): Promise<void> {
    log.verbose(PRE, 'messageSendMiniProgram()')

    const contactIdOrRoomId =  receiver.roomId || receiver.contactId
    const {
      // username, // UNKNOW
      appid, // 小程序关联的微信公众号ID
      title,
      pagePath,
      description,
      thumbUrl,
      thumbKey,
    } = miniProgramPayload

    const _miniProgram: MiniProgram = {
      app_name: appid! + '@app',
      describe: description,
      my_account: this.selfId(),
      page_path: pagePath,
      thumb_key: thumbKey,
      thumb_url: thumbUrl,
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
    } else if (payload.type === MessageType.ChatHistory) {
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
    log.verbose(PRE, 'messageMiniProgram(%s)', messageId)

    return {
      title : 'Macpro title for ' + messageId,
      username: '',
    }
  }

  public async messageContact (messageId: string): Promise<string> {
    log.warn(`messageContact() need to be implemented, ${messageId}`)
    throw new Error(`messageContact() not supported now`)
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
      MacproMessageType.Gif,
    ]
    if (supportedMessageTypeToFileBox.includes(messageType)) {
      const fileBox = FileBox.fromUrl(messagePayload.content)
      if (messageType === MacproMessageType.Voice) {
        fileBox.metadata = {
          voiceLength: messagePayload.voice_len,
        }
      } else if (messageType === MacproMessageType.File) {
        fileBox.metadata = {
          fileName: messagePayload.file_name ? messagePayload.file_name : '未命名',
        }
      }
      return fileBox
    } else {
      throw new Error(`Can not get filebox for message type: ${MacproMessageType[messageType]}`)
    }
  }

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
    roomId: string,
  ): Promise<MacproRoomPayload> {
    log.verbose(PRE, 'roomRawPayload(%s)', roomId)

    if (!this.cacheManager) {
      throw CacheManageError('roomRawPayload()')
    }

    let rawPayload = await this.cacheManager.getRoom(roomId)

    if (!rawPayload || rawPayload.members.length === 0 || rawPayload.owner === '') {
      await this.room.syncRoomDetailInfo(this.selfId(), roomId)

      return new Promise((resolve) => {
        this.room.pushRoomCallback(roomId, async (room: MacproRoomPayload) => {
          resolve(room)
        })
      })
    } else {
      return rawPayload
    }
  }

  public async roomRawPayloadParser (
    rawPayload: MacproRoomPayload,
  ): Promise<RoomPayload> {
    log.verbose(PRE, 'roomRawPayloadParser()')
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
    let _roomList: string[] = []

    if (!this.cacheManager) {
      throw CacheManageError(`roomList()`)
    }
    const roomIdList = await this.cacheManager.getRoomIds()
    log.verbose(PRE, `roomList() length = ${roomIdList.length}`)
    await Promise.all(roomIdList.map(async roomId => {
      if (!this.cacheManager) {
        throw CacheManageError(`roomList()`)
      }

      const roomMembers = await this.cacheManager.getRoomMember(roomId)

      if (roomMembers && Object.keys(roomMembers).length > 0) {
        _roomList.push(roomId)
      } else {
        await this.roomRawPayload(roomId)
      }

    }))
    return _roomList
  }

  public async roomMemberList (roomId: string) : Promise<string[]> {
    log.verbose(PRE, 'roomMemberList(%s)', roomId)

    if (!this.cacheManager) {
      throw CacheManageError('roomMemberList()')
    }

    let roomMemberListPayload = await this.cacheManager.getRoomMember(roomId)

    if (roomMemberListPayload === undefined) {
      roomMemberListPayload = {}
      await this.room.roomMember(this.selfId(), roomId)

      return new Promise((resolve) => {
        this.room.pushRoomMemberCallback(roomId, async (macproMembers) => {
          macproMembers.map(member => {
            roomMemberListPayload![member.accountAlias] = member
          })
          if (roomMemberListPayload) {
            if (!this.cacheManager) {
              throw CacheManageError('pushRoomMemberCallback()')
            }
            await this.cacheManager.setRoomMember(roomId, roomMemberListPayload)
            resolve(Object.keys(roomMemberListPayload))
          } else {
            throw new Error(`can not get room members by roomId: ${roomId}`)
          }
        })
      })
    }
    return Object.keys(roomMemberListPayload)
  }

  public async roomMemberRawPayload (roomId: string, contactId: string): Promise<MacproRoomMemberPayload>  {
    log.verbose(PRE, 'roomMemberRawPayload(%s, %s)', roomId, contactId)

    if (!this.cacheManager) {
      throw CacheManageError('roomMemberRawPayload()')
    }
    let roomMemberListPayload = await this.cacheManager.getRoomMember(roomId)
    if (roomMemberListPayload === undefined) {
      roomMemberListPayload = {}
      await this.room.roomMember(this.selfId(), roomId)

      this.room.pushRoomMemberCallback(roomId, async (macproMembers) => {
        macproMembers.map(member => {
          roomMemberListPayload![member.accountAlias] = member
        })
        if (roomMemberListPayload) {
          if (!this.cacheManager) {
            throw CacheManageError('pushRoomMemberCallback()')
          }
          await this.cacheManager.setRoomMember(roomId, roomMemberListPayload)
        } else {
          throw new Error(`can not get room members by roomId: ${roomId}`)
        }
      })
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

  public async roomAvatar (roomId: string): Promise<FileBox> {
    log.verbose(PRE, 'roomAvatar(%s)', roomId)

    if (!this.cacheManager) {
      throw CacheManageError(`roomAvatar()`)
    }

    const payload = await this.cacheManager.getRoom(roomId)

    if (payload && payload.thumb) {
      return FileBox.fromUrl(payload.thumb)
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

    if (topic) {
      await this.room.modifyRoomTopic(this.selfId(), roomId, topic)

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

    await this.room.createRoom(this.selfId(), contactIdList, topic)

    return new Promise<string>((resolve) => {
      this.grpcGateway.on('room-create', async data => {
        const roomCreate: MacproCreateRoom = JSON.parse(data)
        const roomPayload = await this.convertCreateRoom(roomCreate, contactIdList.toString())

        if (!this.cacheManager) {
          throw CacheManageError('roomCreate()')
        }

        if (roomCreate && roomCreate.account) {
          await this.cacheManager.setRoom(roomCreate.account, roomPayload)
        }
        const roomId = roomCreate.account

        resolve(roomId)
      })
    })

  }

  private async convertCreateRoom (room: MacproCreateRoom, contactIdList: string): Promise<MacproRoomPayload> {
    log.silly(PRE, `convertCreateRoom() : ${contactIdList}`)
    const contactList = contactIdList.split(',')
    const members: MacproContactPayload[] = []

    contactList.map(async contactId => {
      if (!this.cacheManager) {
        throw CacheManageError('convertCreateRoom()')
      }
      let contact: MacproContactPayload | undefined
      contact = await this.cacheManager.getContact(contactId)
      if (contact) {
        members.push(contact)
      } else {
        throw new Error(`can not get contact payload`)
      }
    })

    const roomPayload: MacproRoomPayload = {
      disturb: 1,
      members,
      name: room.name,
      number: room.account,
      owner: room.my_account,
      thumb: room.headerImage,
    }
    return roomPayload
  }

  public async roomAdd (
    roomId    : string,
    contactId : string,
  ): Promise<void> {
    log.verbose(PRE, 'roomAdd(%s, %s)', roomId, contactId)

    const accountId = await this.getAccountId(contactId)
    if (accountId === '') {
      throw new Error(`can not get accountId for ADD MEMBER to ROOM : ${contactId}`)
    }
    const room = await this.roomRawPayload(roomId)
    const roomMemberNum = room.members && room.members.length

    if (roomMemberNum < 40) {
      await this.room.roomAdd(this.selfId(), roomId, accountId)
    } else {
      await this.room.roomInvite(this.selfId(), roomId, accountId)
    }
  }

  private async getAccountId (id: string): Promise<string> {
    if (!this.cacheManager) {
      throw CacheManageError('getAccountId()')
    }
    const contact = await this.cacheManager.getContact(id)
    if (contact && contact.account !== contact.accountAlias) {
      return contact.account
    } else if (contact && contact.account) {
      return contact.accountAlias
    } else {
      // TODO: should be careful about empty string
      return ''
    }
  }

  public async roomDel (
    roomId    : string,
    contactId : string,
  ): Promise<void> {
    log.verbose(PRE, 'roomDel(%s, %s)', roomId, contactId)

    const accountId = await this.getAccountId(contactId)
    if (accountId === '') {
      throw new Error(`can not get accountId for DELETE MEMBER to ROOM : ${contactId}`)
    }
    const res = await this.room.roomDel(this.selfId(), roomId, accountId)
    if (res === RequestStatus.Success) {
      if (!this.cacheManager) {
        throw new Error(`no cacheManager`)
      }
      const roomMembers = await this.cacheManager.getRoomMember(roomId)
      if (!roomMembers) {
        throw new Error(`can not get room member from cache by roomId: ${roomId}`)
      }
      delete roomMembers[contactId]
      await this.cacheManager.setRoomMember(roomId, roomMembers)
    }
  }

  public async roomQuit (roomId: string): Promise<void> {
    log.verbose(PRE, 'roomQuit(%s)', roomId)

    await this.room.roomQuit(this.selfId(), roomId)
  }

  public async roomQrcode (roomId: string): Promise<string> {
    log.verbose(PRE, 'roomQrcode(%s)', roomId)

    await this.room.roomQrcode(this.selfId(), roomId)

    return new Promise((resolve) => {
      this.room.pushRoomQrcodeCallback(roomId, (qrcode: string) => {
        resolve(qrcode)
      })
    })
  }

  public async roomAnnounce (roomId: string)                : Promise<string>
  public async roomAnnounce (roomId: string, text: string)  : Promise<void>

  public async roomAnnounce (roomId: string, text?: string) : Promise<void | string> {
    log.silly(PRE, `roomAnnounce() room id: ${roomId}, text: ${text}`)
    if (text) {
      await this.room.setAnnouncement(this.selfId(), roomId, text)
    } else {
      throw new Error(`not supported get room announcement.`)
    }
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

    await this._friendshipAdd(contactId, hello)
  }

  private async _friendshipAdd (
    contactId: string,
    hello: string,
  ) {
    if (!this.cacheManager) {
      throw CacheManageError('friendshipAdd()')
    }
    const contact = await this.cacheManager.getContact(contactId)
    const extend = this.selfId() + contactId

    if (contact) {
      await this.user.addFriend(this.selfId(), contact.accountAlias, hello)
    } else {
      await this.user.addFriend(this.selfId(), contactId, hello)
    }
    const result = await new Promise<AddFriendBeforeAccept>(async (resolve) => {
      this.addFriendCB[extend] = (data: AddFriendBeforeAccept) => {
        resolve(data)
      }
    })
    return result
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
    await this.user.acceptFriend(this.selfId(), friendshipPayload.contactId)
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
