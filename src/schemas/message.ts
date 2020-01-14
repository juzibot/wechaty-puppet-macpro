import { MessageSendType, MacproMessageType } from './macpro-enums'

/* eslint camelcase: 0 */
export interface GrpcMessagePayload {
  my_account: string,
  my_name: string,
  my_account_alias?: string,
  to_account: string,
  to_account_alias?: string,
  to_name: string,
  content: string,
  voice_len?: number,
  msgid: string,
  content_type?: MacproMessageType,
  send_time: number,
}

export interface GrpcPrivateMessagePayload extends GrpcMessagePayload {
  type: number,
  file_name?: string,
}

export interface GrpcPublicMessagePayload extends GrpcMessagePayload {
  g_number: string,
  g_name: string,
}

export interface GrpcNewFriendMessagePayload {
  uid: number,
  my_account: string,
  my_name: string,
  to_account: string,
  data: string,
  type: number,
  time: number,
}

export interface MacproMessagePayload {
  content_type: MacproMessageType,
  content: string,
  file_name?: string,
  g_name?: string,
  g_number?: string,
  messageId: string,
  msg_source?: string,
  my_account_alias?: string, // MY wxid
  my_account: string, // MY weixin
  my_name: string,
  timestamp: number,
  to_account_alias?: string, // TO wxid
  to_account: string, // TO weixin
  to_name: string,
  type?: MessageSendType,
  voice_len?: number | string,
}

export interface MiniProgram  {
  my_account: string,
  to_account: string,
  app_name: string,
  title: string,
  describe?: string,
  thumb_url?: string,
  thumb_key?: string,
  page_path?: string,
  type?: number,
}

export interface MacproUrlLink {
  description?  : string,
  thumbnailUrl? : string,
  title         : string,
  url           : string,
}

export interface MacproMessageSource {
  silence?: boolean,
  memberCount?: number,
  atUserList?: string[],
}
