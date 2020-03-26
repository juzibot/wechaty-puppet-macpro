#!/usr/bin/env ts-node

// tslint:disable:max-line-length
// tslint:disable:no-shadowed-variable
import test  from 'blue-tape'

import {
  YOU,
}                               from 'wechaty-puppet'

import {
  RoomJoinEvent,
  MacproMessagePayload,
}                                 from '../schemas'

import { roomJoinEventMessageParser }  from './room-event-join-message-parser'

test('roomJoinEventMessageParser() ZH-other-invite-other', async t => {

  const MESSAGE_PAYLOAD: MacproMessagePayload = {
    content: '"高原ོ"邀请"奥斯陆"加入了群聊',
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
    voice_len: 1,
  }

  const EXPECTED_EVENT: RoomJoinEvent = {
    inviteeNameList: ['奥斯陆'],
    inviterName: '高原ོ',
    roomId: '23761343687@chatroom',
    timestamp: 0,
  }

  const event = await roomJoinEventMessageParser(MESSAGE_PAYLOAD)
  t.deepEqual(event, EXPECTED_EVENT, 'should parse room join message payload')
})

test('roomJoinEventMessageParser() ZH-other-invite-others', async t => {
  const MESSAGE_PAYLOAD: MacproMessagePayload = {
    content: '"高原ོ"邀请"袋袋-句子互动商务、百年-句子技术支持"加入了群聊',
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

  const EXPECTED_EVENT: RoomJoinEvent = {
    inviteeNameList : ['袋袋-句子互动商务', '百年-句子技术支持'],
    inviterName     : '高原ོ',
    roomId          : '23761343687@chatroom',
    timestamp       : 0,
  }

  const event = await roomJoinEventMessageParser(MESSAGE_PAYLOAD)
  t.deepEqual(event, EXPECTED_EVENT, 'should parse event')
})

test('roomJoinEventMessageParser() ZH-other-invite-bot', async t => {
  const MESSAGE_PAYLOAD: MacproMessagePayload = {
    content: '"我爱抓娃娃-抓抓抓抓抓抓抓抓"邀请你加入了群聊，群聊参与人还有：苏畅👾、高原ོ',
    content_type: 10,
    file_name: '',
    g_name: '群聊',
    g_number: '23761343687@chatroom',
    messageId: '1',
    my_account: 'wxid_v7j3e9kna9l912',
    my_account_alias: 'wxid_v7j3e9kna9l912',
    my_name: '李青青',
    timestamp: 0,
    to_account: 'wxid_v7j3e9kna9l912',
    to_account_alias: 'wxid_v7j3e9kna9l912',
    to_name: '李青青',
    voice_len: 1,
  }

  const EXPECTED_EVENT: RoomJoinEvent = {
    inviteeNameList : [YOU],
    inviterName     : '我爱抓娃娃-抓抓抓抓抓抓抓抓',
    roomId          : '23761343687@chatroom',
    timestamp       : 0,
  }

  const event = await roomJoinEventMessageParser(MESSAGE_PAYLOAD)
  t.deepEqual(event, EXPECTED_EVENT, 'should parse event')
})

test('roomJoinEventMessageParser() ZH-other-invite-bot-with-other', async t => {
  const MESSAGE_PAYLOAD: MacproMessagePayload = {
    content: '"高原ོ"邀请你加入了群聊，群聊参与人还有：苏畅👾、袋袋-句子互动商务、百年-句子技术支持、奥斯陆、彩虹桥',
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
  const EXPECTED_EVENT: RoomJoinEvent = {
    inviteeNameList : [YOU],
    inviterName     : '高原ོ',
    roomId          : '23761343687@chatroom',
    timestamp       : 0,
  }

  const event = await roomJoinEventMessageParser(MESSAGE_PAYLOAD)
  t.deepEqual(event, EXPECTED_EVENT, 'should parse event')
})

test('roomJoinEventMessageParser() ZH-bot-invite-one', async t => {
  const MESSAGE_PAYLOAD: MacproMessagePayload = {
    content: '你邀请"高原ོ"加入了群聊  ',
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
    voice_len: 1,
  }
  const EXPECTED_EVENT: RoomJoinEvent = {
    inviteeNameList : ['高原ོ'],
    inviterName     : YOU,
    roomId          : '23761343687@chatroom',
    timestamp       : 0,
  }

  const event = await roomJoinEventMessageParser(MESSAGE_PAYLOAD)
  t.deepEqual(event, EXPECTED_EVENT, 'should parse event')
})

/**
 * See more in https://github.com/lijiarui/wechaty-puppet-padchat/issues/55
 */
test('roomJoinEventMessageParser() ZH-bot-invite-three-bot-is-owner', async t => {
  const MESSAGE_PAYLOAD: MacproMessagePayload = {
    content: '你邀请"高原ོ、袋袋-句子互动商务、百年-句子技术支持"加入了群聊  ',
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
  const EXPECTED_EVENT: RoomJoinEvent = {
    inviteeNameList : ['高原ོ', '袋袋-句子互动商务', '百年-句子技术支持'],
    inviterName     : YOU,
    roomId          : '23761343687@chatroom',
    timestamp       : 0,
  }

  const event = await roomJoinEventMessageParser(MESSAGE_PAYLOAD)
  t.deepEqual(event, EXPECTED_EVENT, 'should parse event')
})

test('roomJoinEventMessageParser() ZH-bot-invite-three-bot-is-not-owner', async t => {
  const MESSAGE_PAYLOAD: MacproMessagePayload = {
    content: '"高原ོ"邀请"袋袋-句子互动商务、百年-句子技术支持、彩虹桥"加入了群聊',
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
  const EXPECTED_EVENT: RoomJoinEvent = {
    inviteeNameList : ['袋袋-句子互动商务', '百年-句子技术支持', '彩虹桥'],
    inviterName     : '高原ོ',
    roomId          : '23761343687@chatroom',
    timestamp       : 0,
  }

  const event = await roomJoinEventMessageParser(MESSAGE_PAYLOAD)
  t.deepEqual(event, EXPECTED_EVENT, 'should parse event')
})

test('roomJoinEventMessageParser() ZH-scan-qrcode-shared-by-bot-when-bot-not-owner', async t => {
  const MESSAGE_PAYLOAD: MacproMessagePayload = {
    content: '"高原ོ"通过扫描你分享的二维码加入群聊  ',
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
  const EXPECTED_EVENT: RoomJoinEvent = {
    inviteeNameList : ['高原ོ'],
    inviterName     : YOU,
    roomId          : '23761343687@chatroom',
    timestamp       : 0,
  }

  const event = await roomJoinEventMessageParser(MESSAGE_PAYLOAD)
  t.deepEqual(event, EXPECTED_EVENT, 'should parse event')
})

test('roomJoinEventMessageParser() ZH-scan-qrcode-shared-by-other-when-bot-no-owner', async t => {
  const MESSAGE_PAYLOAD: MacproMessagePayload = {
    content: '" 奥斯陆"通过扫描"高原ོ"分享的二维码加入群聊',
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
  const EXPECTED_EVENT: RoomJoinEvent = {
    inviteeNameList : ['奥斯陆'],
    inviterName     : '高原ོ',
    roomId          : '23761343687@chatroom',
    timestamp       : 0,
  }

  const event = await roomJoinEventMessageParser(MESSAGE_PAYLOAD)
  t.deepEqual(event, EXPECTED_EVENT, 'should parse event')
})
