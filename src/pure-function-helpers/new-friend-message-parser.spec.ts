#!/usr/bin/env ts-node

// tslint:disable:max-line-length
// tslint:disable:no-shadowed-variable

import test from 'blue-tape'

import {
  GrpcNewFriendMessagePayload, MacproContactPayload,
} from '../schemas'

import { newFriendMessageParser } from './new-friend-message-parser'

test('messageRawPayloadParser', async t => {

  t.test('text', async t => {
    const NEW_FRIEND_MESSAGE_PAYLOAD: GrpcNewFriendMessagePayload = {
      data: '{"name":"奥斯陆","account":"botorange333","sex":0,"area":"","thumb":"http://wx.qlogo.cn/mmhead/ver_1/BZ0hia5b6p5k9JibbaOTIVkjYGUJnGu9SiaHfSVYGGyiaaZ6CY8WH2uyIJMfFyX22uPvFePTRVTOtVnJkVGM9qUGelX5zL6WbjqI370mHk9hVag/0"}',
      my_account: 'wxid_v7j3e9kna9l912',
      my_name: '李青青',
      time: 1567223647,
      to_account: 'botorange333',
      type: 1,
      uid: 2875,
    }
    const EXPECTED_MESSAGE_PAYLOAD_TEXT: MacproContactPayload = {
      account: 'botorange333',
      accountAlias: 'botorange333',
      city: '',
      province: '',
      description: '',
      disturb: '',
      formName: '',
      name: '奥斯陆',
      sex: 0,
      thumb: 'http://wx.qlogo.cn/mmhead/ver_1/BZ0hia5b6p5k9JibbaOTIVkjYGUJnGu9SiaHfSVYGGyiaaZ6CY8WH2uyIJMfFyX22uPvFePTRVTOtVnJkVGM9qUGelX5zL6WbjqI370mHk9hVag/0',
      v1: '',
    }
    const actualPayload = newFriendMessageParser(NEW_FRIEND_MESSAGE_PAYLOAD)
    t.deepEqual(actualPayload, EXPECTED_MESSAGE_PAYLOAD_TEXT)
  })

})
