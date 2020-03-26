#!/usr/bin/env ts-node

// tslint:disable:max-line-length
// tslint:disable:no-shadowed-variable

import test  from 'blue-tape'

import {
  YOU,
}                               from 'wechaty-puppet'

import {
  RoomLeaveEvent,
  MacproMessagePayload,
}                                 from '../schemas'

import { roomLeaveEventMessageParser }  from './room-event-leave-message-parser'

test('roomLeaveEventMessageParser() ZH-bot-delete-other', async t => {
  const MESSAGE_PAYLOAD: MacproMessagePayload = {
    content: '你将"百年-句子技术支持"移出了群聊',
    content_type: 10,
    file_name: '',
    g_name: 'Bots',
    g_number: '23761343687@chatroom',
    messageId: '1',
    my_account: 'wxid_v7j3e9kna9l912',
    my_account_alias: 'wxid_v7j3e9kna9l912',
    my_name: '李青青',
    timestamp: 0,
    to_account: 'wxid_v7j3e9kna9l912',
    to_account_alias: 'wxid_v7j3e9kna9l912',
    to_name: '李青青',
    voice_len: 0,
  }

  const EXPECTED_EVENT: RoomLeaveEvent = {
    leaverNameList : ['百年-句子技术支持'],
    removerName    : YOU,
    roomId         : '23761343687@chatroom',
    timestamp      : 0,
  }

  const payload = roomLeaveEventMessageParser(MESSAGE_PAYLOAD)
  // console.log('payload:', payload)
  t.deepEqual(payload, EXPECTED_EVENT, 'should parse room leave message payload')
})

test('roomLeaveEventMessageParser() ZH-bot-delete-others', async t => {
  t.skip('the same as bot-delete-other')
})

test('roomLeaveEventMessageParser() ZH-other-delete-bot', async t => {
  const MESSAGE_PAYLOAD: MacproMessagePayload = {
    content: '你被"高原ོ"移出群聊',
    content_type: 10,
    file_name: '',
    g_name: 'Bots',
    g_number: '23761343687@chatroom',
    messageId: '1',
    my_account: 'wxid_v7j3e9kna9l912',
    my_account_alias: 'wxid_v7j3e9kna9l912',
    my_name: '李青青',
    timestamp: 0,
    to_account: 'wxid_v7j3e9kna9l912',
    to_account_alias: 'wxid_v7j3e9kna9l912',
    to_name: '李青青',
    voice_len: 0,
  }
  const EXPECTED_EVENT: RoomLeaveEvent = {
    leaverNameList : [YOU],
    removerName    : '高原ོ',
    roomId         : '23761343687@chatroom',
    timestamp      : 0,
  }

  const payload = roomLeaveEventMessageParser(MESSAGE_PAYLOAD)
  // console.log('payload:', payload)
  t.deepEqual(payload, EXPECTED_EVENT, 'should parse room leave message payload')
})

test('roomLeaveEventMessageParser() ZH-other-delete-other', async t => {
  t.skip('bot will not see any message, can not detected')
})

test('roomLeaveEventMessageParser() ZH-other-delete-others', async t => {
  t.skip('bot will not see any message, can not detected')
})
