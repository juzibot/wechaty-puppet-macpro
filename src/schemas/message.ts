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
  messageId?: string,
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
  my_account: string,
  my_name: string,
  my_account_alias?: string,
  to_account: string,
  to_account_alias?: string,
  to_name: string,
  content: string,
  timestamp: number,
  messageId: string,
  voice_len?: number | string,
  content_type: MacproMessageType,
  type?: MessageSendType,
  file_name?: string,
  g_number?: string,
  g_name?: string,
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
