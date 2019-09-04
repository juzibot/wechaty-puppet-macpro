/* eslint camelcase: 0 */
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
