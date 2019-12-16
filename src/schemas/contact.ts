/* eslint camelcase: 0 */
import { BaseModel } from './index'
import { ContactGender } from 'wechaty-puppet'

export interface AliasModel extends BaseModel {
  contactId: string,
  remark: string,
}

export interface GrpcContactPayload {
  account_alias: string,
  account: string,
  area: string,
  description: string,
  disturb: string,
  form_name: string,
  name: string,
  sex: string,
  thumb: string,
  v1: string,
}

export interface GrpcContactInfo {
  username: string,
  alias: string,
  nickname: string,
  signature: string,
  headurl: string,
}

export interface MacproContactPayload {
  accountAlias: string,
  account: string,
  city: string,
  province: string,
  description: string,
  disturb: string,
  formName: string,
  name: string,
  sex: ContactGender,
  thumb: string,
  v1: string,
}

export interface ContactList extends BaseModel {
  currentPage: number,
  total: number,
  info: GrpcContactPayload[]
}
