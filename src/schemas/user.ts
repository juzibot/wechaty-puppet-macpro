/* eslint camelcase: 0 */
export interface GrpcLoginInfo {
  type: number,
  account: string,
  account_alias: string,
  name: string,
  thumb: string,
  extend: string,
  task_id: string,
}

export interface DownloadFileRequestData {
  my_account: string, // 必须] 登录微信号
  dContent: string, // 必须]文件类型 原数据
  dFromUser: string, // 必须] 文件类型 发送人wxid
  dMsgId: string, // 必须] 文件类型 消息id
  dToUser: string, // 必须] 文件类型 接收人wxid
  msgid: string, // 必须] 消息id
  content_type: number, // 必须] 文件类型
  message_type: number, // 必须] 1单聊 2群聊
}

export interface DownloadFileResponseData {
  my_account: string, // 登陆微信号
  my_account_alias: string, // 登陆wxid
  msgId: string, // 消息Id
  content: string, // 内容
  message_type: string, // 1 单聊 2群聊
  type: string, // 10 此回调标识
}
