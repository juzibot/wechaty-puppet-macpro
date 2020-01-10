/* eslint camelcase: 0 */

export interface GrpcFriendshipAcceptedData {
  my_account: string,
  my_name: string,
  to_account: string,
  data: string,
  type: number,
  time: number,
  v1: string,
  my_account_alias: string,
  to_account_alias: string,
}

export interface GrpcFriendshipAcceptedDetail {
  name: string,
  account: string,
  sex: number,
  area: string,
  thumb: string,
  account_alias: string,
}

export interface GrpcFriendshipRawPayload {
  account: string,
  my_account: string,
  account_alias: string,
  encodeUserName: string,
  nickname: string,
  sex: string,
  country: string,
  province: string,
  city: string,
  sign: string,
  headHDImgUrl: string,
  headImgUrl: string,
  check_msg: string,
  source: string,
  sourceNickname: string,
  sourceAccount: string,
  sourceGroupNumber: string,
}

export interface Friend {
  name: string,
  v1: string,
  account: string,
  sex: string,
  area: string,
  thumb: string,
}

export interface AddFriend {
  my_account: string,
  my_name: string,
  to_account: string,
  to_name: string,
  type: number,
  time: number,
  data: Friend,
  extend: string,
}

export interface DeleteFriend {
  account: string,
  account_alias: string,
}

export interface AddFriendBeforeAccept {
  my_account: string,
  phone: number,
  to_account: string,
  to_name: string,
  to_thumb: string,
  type: number,
}

export interface MacproFriendInfo {
  friendAccount: string,
  friendPhone: number,
  friendThumb: string,
  myAccount: string,
}
