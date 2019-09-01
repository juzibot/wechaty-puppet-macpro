import { v4 as uuid } from 'uuid'
import { MacproMessagePayload, GrpcFriendshipRawPayload } from '../schemas'

import { isPayload } from './is-type'
import {
  FriendshipPayload,
  FriendshipPayloadConfirm,
  FriendshipPayloadReceive,
  FriendshipPayloadVerify,
  FriendshipType,
} from 'wechaty-puppet'

/**
 *
 * 1. Friendship Confirm Event
 *
 */
const FRIENDSHIP_CONFIRM_REGEX_LIST = [
  /^You have added (.+) as your WeChat contact. Start chatting!$/,
  /^你已添加了(.+)，现在可以开始聊天了。$/,
  /I've accepted your friend request. Now let's chat!$/,
  /^(.+) just added you to his\/her contacts list. Send a message to him\/her now!$/,
  /^(.+)刚刚把你添加到通讯录，现在可以开始聊天了。$/,
  /^我通过了你的朋友验证请求，现在我们可以开始聊天了$/,
]

export function friendshipConfirmEventMessageParser (
  rawPayload: MacproMessagePayload,
): FriendshipPayload | null {

  if (!isPayload(rawPayload)) {
    return null
  }

  let   matches = null as null | string[]
  const text    = rawPayload.content

  FRIENDSHIP_CONFIRM_REGEX_LIST.some(
    regexp => {
      matches = text.match(regexp)
      return !!matches
    },
  )

  if (!matches) {
    return null
  }
  const payload: FriendshipPayloadConfirm = {
    contactId : rawPayload.to_account_alias || rawPayload.to_account,
    id        : rawPayload.messageId,
    // TODO: needs to add timestamp here.
    timestamp : Date.now(),
    type      : FriendshipType.Confirm,
  }
  return payload
}

/**
 *
 * 2. Friendship Verify Event
 *
 */
const FRIENDSHIP_VERIFY_REGEX_LIST = [
  /^(.+) has enabled Friend Confirmation/,
  /^(.+)开启了朋友验证，你还不是他（她）朋友。请先发送朋友验证请求，对方验证通过后，才能聊天。/,
]

export function friendshipVerifyEventMessageParser (
  rawPayload: MacproMessagePayload,
): FriendshipPayload | null {

  if (!isPayload(rawPayload)) {
    return null
  }

  let   matches = null as null | string[]
  const text    = rawPayload.content

  FRIENDSHIP_VERIFY_REGEX_LIST.some(
    regexp => {
      matches = text.match(regexp)
      return !!matches
    },
  )

  if (!matches) {
    return null
  }

  const payload: FriendshipPayloadVerify = {
    contactId : rawPayload.to_account_alias || rawPayload.to_account,
    id        : rawPayload.messageId,
    // TODO: needs to add timestamp here.
    timestamp : Date.now(),
    type      : FriendshipType.Verify,
  }
  return payload
}

export function friendshipReceiveEventMessageParser (
  rawPayload: GrpcFriendshipRawPayload
): FriendshipPayload | null {

  const id = uuid()
  const friendshipPayload: FriendshipPayloadReceive = {
    contactId : rawPayload.account,
    hello     : rawPayload.check_msg,
    id,
    stranger  : rawPayload.encodeUserName,
    ticket    : rawPayload.encodeUserName,
    // TODO: needs to add timestamp here.
    timestamp : Date.now(),
    type      : FriendshipType.Receive,
  }

  return friendshipPayload
}
