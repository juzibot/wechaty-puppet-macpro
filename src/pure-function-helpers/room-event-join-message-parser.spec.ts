#!/usr/bin/env ts-node

// tslint:disable:max-line-length
// tslint:disable:no-shadowed-variable

import test  from 'blue-tape'

import {
  MacproMessagePayload,
}                                 from '../schemas'

import {
  roomJoinEventMessageParser,
}                               from './room-event-join-message-parser'

test('roomJoinEventMessageParser() not detected', async t => {
  t.equal(
    await roomJoinEventMessageParser(undefined as any),
    null,
    'should return null for undefined',
  )

  t.equal(
    await roomJoinEventMessageParser('null' as any),
    null,
    'should return null for null',
  )

  t.equal(
    await roomJoinEventMessageParser('test' as any),
    null,
    'should return null for string',
  )

  t.equal(
    await roomJoinEventMessageParser({} as any),
    null,
    'should return null for empty object',
  )

  t.equal(
    await roomJoinEventMessageParser({ content: 'fsdfsfsdfasfas' } as MacproMessagePayload),
    null,
    'should return null for MacproMessagePayload with unknown content',
  )

})

test('roomJoinEventMessageParser() Recall Message', async t => {
  const MESSAGE_PAYLOAD: MacproMessagePayload = {
    content: '你已成为新群主',
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
  t.equal(await roomJoinEventMessageParser(MESSAGE_PAYLOAD), null, 'should return null for a normal message recall payload')
})
