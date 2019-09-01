/* eslint camelcase: 0 */
export interface GrpcRoomPayload {
  number: string,
  name: string,
  thumb: string,
  disturb: number,
}

export interface GrpcRoomQrcode {
  group_nickname: string,
  group_number: string,
  headimg: string,
  owner: string,
  qrcode: string,
  type: string,
}

export interface MacproRoomPayload {
  number: string,
  name: string,
  thumb: string,
  disturb: number,
  members: GrpcRoomMemberPayload[],
  owner: string, // owner weixin id
}

export interface GrpcRoomMemberPayload {
  nickName: string,
  displayName: string,
  bigHeadImgUrl: string,
  userName: string,
  number: string, // room id
}

export interface MacproCreateRoom {
  account: string, // room id
  extend: string,
  name: string,
  headerImage: string,
}

export interface MacproRoomInvitationPayload {
  id       : string,
  fromUser : string,
  roomName : string,
  timestamp: number,
  url      : string,
}
