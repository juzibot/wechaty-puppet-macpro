export enum WechatAppMessageType {
  Text                  = 1,
  Img                   = 2,
  Audio                 = 3,
  Video                 = 4,
  Url                   = 5,
  Attach                = 6,
  Open                  = 7,
  Emoji                 = 8,
  VoiceRemind           = 9,
  ScanGood              = 10,
  Good                  = 13,
  Emotion               = 15,
  CardTicket            = 16,
  RealtimeShareLocation = 17,
  ChatHistory           = 19,
  MiniProgram           = 33,
  Transfers             = 2000,
  RedEnvelopes          = 2001,
  ReaderType            = 100001,
}

export enum MacproEmojiType {
  Unknown = 0,
  Static  = 1,    // emoji that does not have animation
  Dynamic = 2,    // emoji with animation
}

// 1 文字 2 图片 4 语音 5 视频 6 文件 7 公众号名片 8 文章链接 9 个人名片 15 动图
export enum MacproMessageType {
  Text              = 1,
  Image             = 2,
  Emoji             = 3,
  Voice             = 4,
  Video             = 5,
  File              = 6,
  PublicCard        = 7,
  UrlLink           = 8,
  PrivateCard       = 9,
  System            = 10,
  MiniProgram       = 11,
  Location          = 12,
  RedPacket         = 13,
  MoneyTransaction  = 14,
  Gif               = 15,
}

export enum AutoLoginError {
  CALL_FAILED = 'CALL_FAILED',
  LOGIN_ERROR = 'LOGIN_ERROR',
}

export enum EncryptionServiceError {
  NO_SESSION = 'NO_SESSION',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
}

export enum MacproErrorType {
  LOGIN = 'LOGIN',
}

export enum MacproAutoLoginErrorType {
  SELF_LOGOUT = 'SELF_LOGOUT',
  TOO_FREQUENT = 'TOO_FREQUENT',
  LOGIN_ANOTHER_DEVICE = 'LOGIN_ANOTHER_DEVICE',
  LOGIN_ANOTHER_DEVICE_WITH_WARN = 'LOGIN_ANOTHER_DEVICE_WITH_WARN',
  SAFETY_LOGOUT = 'SAFETY_LOGOUT',
  UNKNOWN = 'UNKNOWN',
}

/**
 * add by sc
 */

export enum RequestStatus {
  Fail,
  Success,
}

export enum ChatType {
  Unknown,
  Contact,
  Room,
}

export enum EventStatus {
  Fail,
  Success,
}

export enum LoginStatus {
  OFF,
  ON,
}

export interface FileCache {
  fileId: string,
  aesKey: Buffer,
  timestamp: number,
}

export enum GRPC_CODE {
  OK = 0,
  CANCELLED = 1,
  UNKNOWN = 2,
  INVALID_ARGUMENT = 3,
  DEADLINE_EXCEEDED = 4,
  NOT_FOUND = 5,
  ALREADY_EXISTS = 6,
  PERMISSION_DENIED = 7,
  UNAUTHENTICATED = 16,
  RESOURCE_EXHAUSTED = 8,
  FAILED_PRECONDITION = 9,
  ABORTED = 10,
  OUT_OF_RANGE = 11,
  UNIMPLEMENTED = 12,
  INTERNAL = 13,
  UNAVAILABLE = 14,
  DATA_LOSS = 15,
}

export enum MessageSendType {
  SELF_SENT = 1,
  CONTACT_SENT = 2,
}

export enum CallbackType {
  SendAddFriend = 1,
  WeChatInfo    = 2,
  LabelList     = 3,
  ScanStatus    = 4,
  RoomList      = 7,
  ContactOrRoom = 182,
}

export enum AcceptedType {
  BOT = 1,
  OTHERS = 2,
}
