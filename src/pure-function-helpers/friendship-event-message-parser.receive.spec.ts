#!/usr/bin/env ts-node

// tslint:disable:max-line-length
// tslint:disable:no-shadowed-variable

import test from 'blue-tape'

import {
  FriendshipPayload,
  FriendshipType,
} from 'wechaty-puppet'

import { GrpcFriendshipRawPayload } from '../schemas'

import { friendshipReceiveEventMessageParser } from './friendship-event-message-parser'

test('friendshipReceiveEventMessageParser()', async t => {
  const rawPayload: GrpcFriendshipRawPayload = {
    account: 'lylezhuifeng',
    account_alias: '',
    check_msg: '我是群聊"Bots"的高原ོ',
    city: '海淀',
    country: '',
    encodeUserName: 'v1_40dc3fd5081da54825c0094728f564815aafeddfbaff02b71199e10b0fb52506@stranger',
    headHDImgUrl: 'http://wx.qlogo.cn/mmhead/KDLS0fhbCTJ0H7wsWRiaeMdibHvaeoZw1jQScfCqfVaPM/0',
    headImgUrl: '',
    my_account: 'wxid_v7j3e9kna9l912',
    nickname: '高原ོ',
    province: '北京',
    sex: '1',
    sign: '',
    source: '通过群聊添加',
    sourceAccount: '',
    sourceGroupNumber: '11421066118@chatroom',
    sourceNickname: '',
  }

  const EXPECTED_FRIEND_REQUEST_PAYLOAD: FriendshipPayload = {
    contactId: 'lylezhuifeng',
    hello: '我是群聊"Bots"的高原ོ',
    id: 'ID',
    stranger: 'v1_40dc3fd5081da54825c0094728f564815aafeddfbaff02b71199e10b0fb52506@stranger',
    ticket: 'v1_40dc3fd5081da54825c0094728f564815aafeddfbaff02b71199e10b0fb52506@stranger',
    timestamp: 0,
    type: FriendshipType.Receive,
  }

  const friendshipPayload = await friendshipReceiveEventMessageParser(rawPayload)
  /**
   * Override timestamp since this is generated every time.
   */
  const actual = { ...friendshipPayload, id: 'ID', timestamp: 0 }

  t.deepEqual(actual, EXPECTED_FRIEND_REQUEST_PAYLOAD, 'should parse friendshipPayload right')
})
