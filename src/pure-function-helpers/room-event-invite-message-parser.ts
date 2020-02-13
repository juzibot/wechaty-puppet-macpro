import {
  MacproMessagePayload,
  MacproRoomInvitationPayload,
}                         from '../schemas'
import { isPayload } from './is-type'

/*
  {
    des: '"苏畅"邀请你加入群聊💑 长青服饰👫，进入可查看详情。',
    thumb: 'https://u.weixin.qq.com/cgi-bin/getchatroomheadimg?username=A2b0c173cb511be22b53a1c82b35d4a23fa3d32e5a6ff26ae8c5d6b329c40894a&from=1',
    thumbUrl: 'https://u.weixin.qq.com/cgi-bin/getchatroomheadimg?username=A2b0c173cb511be22b53a1c82b35d4a23fa3d32e5a6ff26ae8c5d6b329c40894a&from=1',
    title: '邀请你加入群聊',
    url: 'https://szsupport.weixin.qq.com/cgi-bin/mmsupport-bin/addchatroombyinvite?ticket=AQLzsoRmMDuEklDgVYk1Ow%3D%3D&exportkey=AzhUgt97iGQjWbgIN685zwY%3D&lang=zh_CN&pass_ticket=koiOj6RT7WEd3E2rFUi8rboCPlRar4gQ7GmDydcbiekg8aFmjl9PXjKR9NC0DFOv&wechat_real_lang=zh_CN'
  }
*/

const ROOM_OTHER_INVITE_TITLE_ZH = [
  /邀请你加入群聊/,
]

const ROOM_OTHER_INVITE_TITLE_EN = [
  /Group Chat Invitation/,
]

const ROOM_OTHER_INVITE_LIST_ZH = [
  /^"(.+)"邀请你加入群聊(.+)，进入可查看详情。/,
]

const ROOM_OTHER_INVITE_LIST_EN = [
  /"(.+)" invited you to join the group chat "(.+)"\. Enter to view details\./,
]

export const roomInviteEventMessageParser = async (
  rawPayload: MacproMessagePayload,
): Promise<null | MacproRoomInvitationPayload> => {

  if (!isPayload(rawPayload)) {
    return null
  }

  // eslint-disable-next-line camelcase
  const { content, messageId, timestamp, my_account } = rawPayload
  const jsonPayload: {
    des: string,
    thumb: string,
    thumburl: string,
    title: string,
    url: string,
  } = JSON.parse(content)

  // If no title or des, it is not a room invite event, skip further process
  if (!jsonPayload || !jsonPayload.title || !jsonPayload.des || typeof jsonPayload.title !== 'string' ||  typeof jsonPayload.des !== 'string') {
    return null
  }

  let matchesForOtherInviteTitleEn = null as null | string[]
  let matchesForOtherInviteTitleZh = null as null | string[]
  let matchesForOtherInviteEn = null as null | string[]
  let matchesForOtherInviteZh = null as null | string[]

  ROOM_OTHER_INVITE_TITLE_EN.some(
    regex => !!(matchesForOtherInviteTitleEn = jsonPayload.title.match(regex)),
  )

  ROOM_OTHER_INVITE_TITLE_ZH.some(
    regex => !!(matchesForOtherInviteTitleZh = jsonPayload.title.match(regex)),
  )

  ROOM_OTHER_INVITE_LIST_EN.some(
    regex => !!(matchesForOtherInviteEn = jsonPayload.des.match(regex)),
  )

  ROOM_OTHER_INVITE_LIST_ZH.some(
    regex => !!(matchesForOtherInviteZh = jsonPayload.des.match(regex)),
  )

  const titleMatch = matchesForOtherInviteTitleEn || matchesForOtherInviteTitleZh

  const matchInviteEvent = matchesForOtherInviteEn || matchesForOtherInviteZh

  const matches = !!titleMatch && !!matchInviteEvent

  if (!matches) {
    return null
  }

  return {
    fromUser: my_account,
    id: messageId,
    roomName: matchInviteEvent![2],
    timestamp,
    url: jsonPayload.url,
  }
}
