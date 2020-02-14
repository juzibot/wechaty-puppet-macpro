import { log } from '../config'
import { RequestStatus, MacproMessageType, MiniProgram, MacproUrlLink } from '../schemas'
import { RequestClient } from '../utils/request'
import { isRoomId } from '../pure-function-helpers'

const PRE = 'MacproMessage'

export default class MacproMessage {

  private requestClient: RequestClient

  constructor (requestClient: RequestClient) {
    this.requestClient = requestClient
  }

  // Send message (text, image, url, video, file, gif)
  public async sendMessage (contactId: string, contactIdOrRoomId: string, message: string, messageType: MacproMessageType, fileName?: string, imgSize?: string): Promise<RequestStatus> {
    log.verbose(PRE, `sendMessage()`)

    const data = {
      content: message,
      content_type: messageType,
      file_name: fileName,
      img_size: imgSize,
      my_account: contactId,
      to_account: contactIdOrRoomId,
      type: isRoomId(contactIdOrRoomId) ? 2 : 1,
    }

    const res = await this.requestClient.request({
      apiName: 'sendMessage',
      data,
    })
    log.silly(PRE, `sendMessage : ${JSON.stringify(res)}`)
    if (res.code === RequestStatus.Success) {
      return RequestStatus.Success
    } else {
      return RequestStatus.Fail
    }
  }

  // Send url link
  public sendUrlLink = async (contactId: string, contactIdOrRoomId: string, urlLinkPayload: MacproUrlLink): Promise<RequestStatus> => {
    log.verbose(PRE, `sendUrlLink()`)

    const data = {
      describe: urlLinkPayload.description,
      my_account: contactId,
      thumb: urlLinkPayload.thumbnailUrl,
      title: urlLinkPayload.title,
      to_account: contactIdOrRoomId,
      type: isRoomId(contactIdOrRoomId) ? 2 : 1,
      url: urlLinkPayload.url,
    }

    const res = await this.requestClient.request({
      apiName: 'sendUrlLink',
      data,
    })
    log.silly(PRE, `sendUrlLink : ${JSON.stringify(res)}`)
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
      card_name: cardName,
      my_account: contactId,
      to_account: contactIdOrRoomId,
      type: isRoomId(contactIdOrRoomId) ? 2 : 1,
    }

    const res = await this.requestClient.request({
      apiName: 'sendUserCard',
      data,
    })
    log.silly(PRE, `sendContact : ${JSON.stringify(res)}`)
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
      type: isRoomId(miniProgram.to_account) ? 2 : 1,
    }

    const res = await this.requestClient.request({
      apiName: 'sendApp',
      data,
    })
    log.silly(PRE, `sendMiniProgram : ${JSON.stringify(res)}`)
    if (res.code === RequestStatus.Success) {
      return RequestStatus.Success
    } else {
      return RequestStatus.Fail
    }
  }

}
