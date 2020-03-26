#!/usr/bin/env ts-node

// tslint:disable:max-line-length
// tslint:disable:no-shadowed-variable

import test  from 'blue-tape'

import {
  YOU,
}                               from 'wechaty-puppet'

import {
  RoomTopicEvent,
  MacproMessagePayload,
}                               from '../schemas'

import { roomTopicEventMessageParser }  from './room-event-topic-message-parser'

test('roomTopicEventMessageParser() ZH-bot-modify-topic', async t => {
  const PADCHAT_MESSAGE_PAYLOAD_ROOM_TOPIC: MacproMessagePayload = {
    content: '你修改群名为“botsssss”',
    content_type: 10,
    file_name: '',
    g_name: 'BigBots',
    g_number: '11421066118@chatroom',
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

  const EXPECTED_MESSAGE_PAYLOAD_ROOM_TOPIC: RoomTopicEvent = {
    changerName : YOU,
    roomId      : '11421066118@chatroom',
    timestamp   : 0,
    topic       : 'botsssss',
  }

  const payload = roomTopicEventMessageParser(PADCHAT_MESSAGE_PAYLOAD_ROOM_TOPIC)
  t.deepEqual(payload, EXPECTED_MESSAGE_PAYLOAD_ROOM_TOPIC, 'should parse room topic message payload')
})

test('roomTopicEventMessageParser() ZH-other-modify-topic', async t => {
  const MESSAGE_PAYLOAD: MacproMessagePayload = {
    content: '"高原ོ"修改群名为“BOTs”',
    content_type: 10,
    file_name: '',
    g_name: 'botsssss',
    g_number: '11421066118@chatroom',
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

  const EXPECTED_MESSAGE_PAYLOAD_ROOM_TOPIC: RoomTopicEvent = {
    changerName : '高原ོ',
    roomId      : '11421066118@chatroom',
    timestamp   : 0,
    topic       : 'BOTs',
  }

  const event = roomTopicEventMessageParser(MESSAGE_PAYLOAD)
  t.deepEqual(event, EXPECTED_MESSAGE_PAYLOAD_ROOM_TOPIC, 'should parse room topic message payload')
})
