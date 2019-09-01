import { log } from '../config'
import { RequestStatus, MacproMessageType, MiniProgram } from '../schemas'
import { RequestClient } from '../utils/request'

const PRE = 'MacproMessage'

export default class MacproMessage {

  private requestClient: RequestClient

  constructor (requestClient: RequestClient) {
    this.requestClient = requestClient
  }

  // Send message (text, image, url, video, file, gif)
  public sendMessage = async (contactId: string, contactIdOrRoomId: string, message: string, messageType: MacproMessageType): Promise<RequestStatus> => {
    log.verbose(PRE, `sendMessage()`)

    const data = {
      content: message,
      content_type: messageType,
      my_account: contactId,
      to_account: contactIdOrRoomId,
    }

    const res = await this.requestClient.request({
      apiName: 'sendMessage',
      data,
    })
    log.silly(PRE, `message : ${res.msg}`)
    if (res.code === RequestStatus.Success) {
      return RequestStatus.Success
    } else {
      return RequestStatus.Fail
    }
  }

  // Send url link
  public sendUrlLink = async (contactId: string, contactIdOrRoomId: string, url: string, title: string, describe?: string): Promise<RequestStatus> => {
    log.verbose(PRE, `sendUrlLink()`)

    const data = {
      describe,
      my_account: contactId,
      title,
      to_account: contactIdOrRoomId,
      url,
    }

    const res = await this.requestClient.request({
      apiName: 'sendUrlLink',
      data,
    })
    log.silly(PRE, `message : ${res.msg}`)
    if (res.code === RequestStatus.Success) {
      return RequestStatus.Success
    } else {
      return RequestStatus.Fail
    }
  }

  // send contact card
  public sendContact = async (contactId: string, contactIdOrRoomId: string, cardName: string): Promise<RequestStatus> => {
    log.verbose(PRE, `sendContact()`)

    const data = {
      cardName,
      my_account: contactId,
      to_account: contactIdOrRoomId,
    }

    const res = await this.requestClient.request({
      apiName: 'sendUserCard',
      data,
    })
    log.silly(PRE, `message : ${res.msg}`)
    if (res.code === RequestStatus.Success) {
      return RequestStatus.Success
    } else {
      return RequestStatus.Fail
    }
  }

  // send mini program
  public sendMiniProgram = async (miniProgram: MiniProgram) => {
    log.verbose(PRE, `sendMiniProgram()`)

    const data = {
      app_name: miniProgram.app_name,
      describe: miniProgram.describe || '',
      my_account: miniProgram.my_account,
      page_path: miniProgram.page_path || '',
      thumb_key: miniProgram.thumb_key || '',
      thumb_url: miniProgram.thumb_url || '',
      title: miniProgram.title,
      to_account: miniProgram.to_account,
      type: miniProgram.type || 1,
    }

    const res = await this.requestClient.request({
      apiName: 'sendApp',
      data,
    })
    log.silly(PRE, `message : ${res.msg}`)
    if (res.code === RequestStatus.Success) {
      return RequestStatus.Success
    } else {
      return RequestStatus.Fail
    }
  }

}
