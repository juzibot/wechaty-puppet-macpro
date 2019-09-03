import { log } from '../config'
import { GrpcNewFriendMessagePayload, MacproContactPayload } from '../schemas'
import { ContactGender } from 'wechaty-puppet'

interface NewFriendMessageContactInfo {
  name: string,
  account: string,
  sex: ContactGender,
  area: string,
  thumb: string,
}

export function newFriendMessageParser (
  message: GrpcNewFriendMessagePayload,
): MacproContactPayload | null {
  try {
    const data = message.data
    const contactInfo: NewFriendMessageContactInfo = JSON.parse(data)
    const contact: MacproContactPayload = {
      account: contactInfo.account,
      accountAlias: contactInfo.account,
      area: contactInfo.area,
      description: '',
      disturb: '',
      formName: '',
      name: contactInfo.name,
      sex: contactInfo.sex,
      thumb: contactInfo.thumb,
      v1: '',
    }
    return contact
  } catch (e) {
    log.verbose(`Error happened when trying to parse new friend message:\n${e.stack}`)
    return null
  }
}
