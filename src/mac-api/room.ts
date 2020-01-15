import { log } from '../config'
import { GrpcRoomPayload, RequestStatus, GrpcRoomDetailInfo, MacproRoomMemberPayload, MacproRoomPayload } from '../schemas'
import { RequestClient } from '../utils/request'

const PRE = 'MacproRoom'

export default class MacproRoom {

  private requestClient: RequestClient

  constructor (requestClient: RequestClient) {
    this.requestClient = requestClient
  }

  private roomQrcodeCallbackMap?: { [roomId: string]: Array<(qrcode: string) => void> } = {}

  public pushRoomQrcodeCallback (roomId: string, callback: (qrcode: string) => void) {
    if (!this.roomQrcodeCallbackMap) {
      throw new Error(`no roomQrcodeCallbackMap`)
    }
    if (!this.roomQrcodeCallbackMap[roomId]) {
      this.roomQrcodeCallbackMap[roomId] = []
    }
    this.roomQrcodeCallbackMap[roomId].push(callback)
  }

  public resolveRoomQrcodeCallback (roomId: string, qrcode: string) {
    if (!this.roomQrcodeCallbackMap) {
      throw new Error(`no roomQrcodeCallbackMap`)
    }
    const callbacks = this.roomQrcodeCallbackMap[roomId] && this.roomQrcodeCallbackMap[roomId]
    if (callbacks) {
      callbacks.map(cb => cb(qrcode))
      delete this.roomQrcodeCallbackMap[roomId]
    }
  }

  private roomCallbackMap?: { [roomId: string]: Array<(room: MacproRoomPayload) => void> } = {}

  public pushRoomCallback (roomId: string, callback: (room: MacproRoomPayload) => void) {
    if (!this.roomCallbackMap) {
      throw new Error(`no roomCallbackMap`)
    }
    if (!this.roomCallbackMap[roomId]) {
      this.roomCallbackMap[roomId] = []
    }
    this.roomCallbackMap[roomId].push(callback)
  }

  public resolveRoomCallback (roomId: string, room: MacproRoomPayload) {
    if (!this.roomCallbackMap) {
      throw new Error(`no roomCallbackMap`)
    }
    const callbacks = this.roomCallbackMap[roomId] && this.roomCallbackMap[roomId]
    if (callbacks) {
      callbacks.map(cb => cb(room))
      delete this.roomCallbackMap[roomId]
    }
  }

  private roomMemberCallbackMap?: { [roomId: string]: Array<(macproMembers: MacproRoomMemberPayload[]) => void> } = {}

  public pushRoomMemberCallback (roomId: string, callback: (macproMembers: MacproRoomMemberPayload[]) => void) {
    if (!this.roomMemberCallbackMap) {
      throw new Error(`no roomMemberCallbackMap`)
    }
    if (!this.roomMemberCallbackMap[roomId]) {
      this.roomMemberCallbackMap[roomId] = []
    }
    this.roomMemberCallbackMap[roomId].push(callback)
  }

  public resolveRoomMemberCallback (roomId: string, macproMembers: MacproRoomMemberPayload[]) {
    if (!this.roomMemberCallbackMap) {
      throw new Error(`no roomMemberCallbackMap`)
    }
    const callbacks = this.roomMemberCallbackMap[roomId] && this.roomMemberCallbackMap[roomId]
    if (callbacks) {
      callbacks.map(cb => cb(macproMembers))
      delete this.roomMemberCallbackMap[roomId]
    }
  }

  // 修改微信群名称
  public modifyRoomTopic = async (loginId: string, roomId: string, topic: string): Promise<RequestStatus> => {
    log.verbose(PRE, `modifyRoomTopic(${loginId}, ${roomId}, ${topic})`)

    const data = {
      g_number: roomId,
      my_account: loginId,
      name: topic,
    }

    const res = await this.requestClient.request({
      apiName: 'modifyRoomTopic',
      data,
    })
    log.silly(PRE, `message : ${JSON.stringify(res)}`)
    if (res.code === RequestStatus.Success) {
      return RequestStatus.Success
    } else {
      return RequestStatus.Fail
    }
  }

  /**
   * @deprecated
   * use syncRoomList instead
   */
  public roomList = async (loginId: string, page?: number): Promise<GrpcRoomPayload[]> => {
    log.verbose(PRE, `roomList(${loginId}, ${page})`)

    const data = {
      account: loginId,
      num: 100,
      page: page || 1,
    }

    const res = await this.requestClient.request({
      apiName: 'getRoomList',
      data,
    })
    return res
  }

  // 获取微信群列表
  public syncRoomList = async (loginId: string): Promise<GrpcRoomPayload[]> => {
    log.verbose(PRE, `roomList(${loginId})`)

    const data = {
      my_account: loginId,
      type: 1,
    }

    const res = await this.requestClient.request({
      apiName: 'syncRoomList',
      data,
    })
    return res
  }

  // 获取微信群成员列表
  public roomMember = async (loginId: string, roomId: string): Promise<void> => {
    log.verbose(PRE, `roomMember(${loginId}, ${roomId})`)

    const data = {
      my_account: loginId,
      number: roomId,
    }

    const res = await this.requestClient.request({
      apiName: 'getRoomMemberList',
      data,
    })
    log.silly(PRE, `message : ${JSON.stringify(res)}`)
  }

  /**
   * @deprecated
   * use syncRoomDetailInfo instead
   */
  public roomDetailInfo = async (loginId: string, roomId: string): Promise<GrpcRoomDetailInfo> => {
    log.verbose(PRE, `roomDetailInfo(${loginId}, ${roomId})`)

    const data = {
      g_number: roomId,
      my_account: loginId,
    }

    const res: GrpcRoomDetailInfo = await this.requestClient.request({
      apiName: 'getRoomDetailInfo',
      data,
    })
    return res
  }

  public syncRoomDetailInfo = async (loginId: string, roomId: string): Promise<void> => {
    log.verbose(PRE, `syncRoomDetailInfo(${loginId}, ${roomId})`)

    const data = {
      g_number: roomId,
      my_account: loginId,
    }

    await this.requestClient.request({
      apiName: 'syncRoom',
      data,
    })
  }

  public createRoom = async (loginId: string, contactIdList: string[], topic?: string): Promise<RequestStatus> => {
    log.verbose(PRE, `createRoom(${loginId}, ${contactIdList}, ${topic})`)

    const data = {
      account: contactIdList.toString(),
      group_name: topic,
      my_account: loginId,
    }

    const res = await this.requestClient.request({
      apiName: 'createRoom',
      data,
    })
    log.silly(PRE, `createRoom res : ${JSON.stringify(res)}`)
    if (res) {
      return RequestStatus.Success
    } else {
      return RequestStatus.Fail
    }
  }

  public roomOwner = async (loginId: string, roomId: string): Promise<any> => {
    log.verbose(PRE, `roomOwner(${loginId}, ${roomId})`)

    const data = {
      g_number: roomId,
      my_account: loginId,
    }

    const res = await this.requestClient.request({
      apiName: 'getRoomOwner',
      data,
    })

    return res
  }

  public roomAdd = async (loginId: string, roomId: string, contactId: string): Promise<RequestStatus> => {
    log.verbose(PRE, `roomAdd(${loginId}, ${roomId}, ${contactId})`)

    const data = {
      account: contactId,
      g_number: roomId,
      my_account: loginId,
    }

    const res = await this.requestClient.request({
      apiName: 'addMemberToRoom',
      data,
    })
    log.silly(PRE, `roomAdd message : ${JSON.stringify(res)}`)
    if (res) {
      return RequestStatus.Success
    } else {
      return RequestStatus.Fail
    }
  }

  public roomInvite = async (loginId: string, roomId: string, contactId: string): Promise<RequestStatus> => {
    log.verbose(PRE, `roomAdd(${loginId}, ${roomId}, ${contactId})`)

    const data = {
      account: contactId,
      g_number: roomId,
      my_account: loginId,
    }

    const res = await this.requestClient.request({
      apiName: 'inviteFriendToRoomMoreThanForty',
      data,
    })
    log.silly(PRE, `roomInvite message : ${JSON.stringify(res)}`)
    if (res) {
      return RequestStatus.Success
    } else {
      return RequestStatus.Fail
    }
  }

  public roomDel = async (loginId: string, roomId: string, contactId: string): Promise<RequestStatus> => {
    log.verbose(PRE, `roomDel(${loginId}, ${roomId}, ${contactId})`)

    const data = {
      account: contactId,
      g_number: roomId,
      my_account: loginId,
    }

    const res = await this.requestClient.request({
      apiName: 'removeMemberFromRoom',
      data,
    })
    log.silly(PRE, `roomDel message : ${JSON.stringify(res)}`)
    if (res) {
      return RequestStatus.Success
    } else {
      return RequestStatus.Fail
    }
  }

  public roomQuit = async (loginId: string, roomId: string): Promise<RequestStatus> => {
    log.verbose(PRE, `roomQuit(${loginId}, ${roomId})`)

    const data = {
      g_number: roomId,
      my_account: loginId,
    }

    const res = await this.requestClient.request({
      apiName: 'leaveRoom',
      data,
    })
    log.silly(PRE, `roomQuit message : ${JSON.stringify(res)}`)
    if (res) {
      return RequestStatus.Success
    } else {
      return RequestStatus.Fail
    }
  }

  public roomQrcode = async (loginId: string, roomId: string): Promise<RequestStatus> => {
    log.verbose(PRE, `roomQrcode(${loginId}, ${roomId})`)

    const data = {
      g_number: roomId,
      my_account: loginId,
    }

    const res = await this.requestClient.request({
      apiName: 'getRoomQRCode',
      data,
    })
    log.silly(PRE, `roomQrcode message : ${JSON.stringify(res)}`)
    if (res) {
      return RequestStatus.Success
    } else {
      return RequestStatus.Fail
    }
  }

  public setAnnouncement = async (selfId: string, roomId: string, text: string) => {
    log.verbose(PRE, `setAnnouncement(${selfId}, ${roomId}, ${text})`)

    const data = {
      my_account: selfId,
      notice: text,
      number: roomId,
    }

    const res = await this.requestClient.request({
      apiName: 'setRoomAnnounce',
      data,
    })
    if (res) {
      return RequestStatus.Success
    } else {
      return RequestStatus.Fail
    }
  }

  public atRoomMember = async (loginId: string, roomId: string, atUser: string, content: string): Promise<RequestStatus> => {
    log.verbose(PRE, `atRoomMember(${loginId}, ${roomId}, ${atUser}, ${content})`)

    const data = {
      account: roomId,
      atUser,
      content,
      my_account: loginId,
    }

    const res = await this.requestClient.request({
      apiName: 'atRoomMember',
      data,
    })
    log.silly(PRE, `message : ${JSON.stringify(res)}`)
    if (res.code === RequestStatus.Success) {
      return RequestStatus.Success
    } else {
      return RequestStatus.Fail
    }
  }

}
