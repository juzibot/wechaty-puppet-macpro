#!/usr/bin/env ts-node

// tslint:disable:max-line-length
// tslint:disable:no-shadowed-variable

import test from 'blue-tape'

import {
  MessagePayload, MessageType,
} from 'wechaty-puppet'

import {
  MacproMessagePayload, MacproMessageType,
} from '../schemas'

import {
  messageRawPayloadParser,
} from './message-raw-payload-parser'

test('messageRawPayloadParser', async t => {

  t.test('text', async t => {
    const MACPRO_MESSAGE_PAYLOAD_TEXT: MacproMessagePayload = {
      content: '啦',
      content_type: 1,
      dContent: '',
      dFromUser: '',
      dMsgId: '1',
      dPlaceholder: '',
      dToUser: '',
      file_name: '',
      messageId: '1',
      my_account: 'wxid_v7j3e9kna9l912',
      my_account_alias: 'wxid_v7j3e9kna9l912',
      my_name: '李青青',
      timestamp: 0,
      to_account: 'lylezhuifeng',
      to_name: '球球',
      type: 2,
      voice_len: 0,
    }
    const EXPECTED_MESSAGE_PAYLOAD_TEXT: MessagePayload = {
      fromId: 'lylezhuifeng',
      id: '1',
      mentionIdList: [],
      roomId: undefined,
      text: '啦',
      timestamp: 0,
      toId: 'wxid_v7j3e9kna9l912',
      type: MessageType.Text,
    }
    const actualPayload = await messageRawPayloadParser(MACPRO_MESSAGE_PAYLOAD_TEXT)
    t.deepEqual(actualPayload, EXPECTED_MESSAGE_PAYLOAD_TEXT)
  })

  t.test('voice', async t => {
    const MACPRO_MESSAGE_PAYLOAD_VOICE: MacproMessagePayload = {
      content: 'https://wkgj.oss-cn-beijing.aliyuncs.com/files/20190831/6bf0c33d449eeaff40069de530db7aa2.mp3',
      content_type: 4,
      dContent: '',
      dFromUser: '',
      dMsgId: '1',
      dPlaceholder: '',
      dToUser: '',
      file_name: '',
      messageId: '1',
      my_account: 'wxid_v7j3e9kna9l912',
      my_account_alias: 'wxid_v7j3e9kna9l912',
      my_name: '李青青',
      timestamp: 0,
      to_account: 'lylezhuifeng',
      to_name: '球球',
      type: 2,
      voice_len: 1,
    }
    const EXPECTED_MESSAGE_PAYLOAD_VOICE: MessagePayload = {
      fromId: 'lylezhuifeng',
      id: '1',
      mentionIdList: [],
      roomId: undefined,
      text: 'https://wkgj.oss-cn-beijing.aliyuncs.com/files/20190831/6bf0c33d449eeaff40069de530db7aa2.mp3',
      timestamp: 0,
      toId: 'wxid_v7j3e9kna9l912',
      type: MessageType.Audio,
    }
    const actualPayload = await messageRawPayloadParser(MACPRO_MESSAGE_PAYLOAD_VOICE)
    t.deepEqual(actualPayload, EXPECTED_MESSAGE_PAYLOAD_VOICE)
  })

  test('attachment file with ext .xlsx', async t => {
    const FILE_MESSAGE_PAYLOAD: MacproMessagePayload = {
      content: 'https://wkgj.oss-cn-beijing.aliyuncs.com/files/20190831/7f24126d7c269d815f8827f307fc48d0.xlsx',
      content_type: MacproMessageType.File,
      dContent: '',
      dFromUser: '',
      dMsgId: '1',
      dPlaceholder: '',
      dToUser: '',
      file_name: '报价.xlsx',
      messageId: '1',
      my_account: 'wxid_v7j3e9kna9l912',
      my_account_alias: 'wxid_v7j3e9kna9l912',
      my_name: '李青青',
      timestamp: 0,
      to_account: 'lylezhuifeng',
      to_name: '高原ོ',
      type: 2,
      voice_len: 1,
    }

    const EXPECTED_PAYLOAD: MessagePayload = {
      fromId: 'lylezhuifeng',
      id: '1',
      mentionIdList: [],
      roomId: undefined,
      text: 'https://wkgj.oss-cn-beijing.aliyuncs.com/files/20190831/7f24126d7c269d815f8827f307fc48d0.xlsx',
      timestamp: 0,
      toId: 'wxid_v7j3e9kna9l912',
      type: 1,
    }

    const payload = await messageRawPayloadParser(FILE_MESSAGE_PAYLOAD)

    t.deepEqual(payload, EXPECTED_PAYLOAD, 'should parse share card message peer to peer')
  })

})

// test('room invitation created by bot', async t => {
//   const MESSAGE_PAYLOAD: MacproMessagePayload = {
//     content      : '3453262102@chatroom:\n<sysmsg type="delchatroommember">\n\t<delchatroommember>\n\t\t<plain><![CDATA[You invited . 李 卓 桓 .呵呵 to the group chat.   ]]></plain>\n\t\t<text><![CDATA[You invited . 李 卓 桓 .呵呵 to the group chat.   ]]></text>\n\t\t<link>\n\t\t\t<scene>invite</scene>\n\t\t\t<text><![CDATA[  Revoke]]></text>\n\t\t\t<memberlist>\n\t\t\t\t<username><![CDATA[wxid_a8d806dzznm822]]></username>\n\t\t\t</memberlist>\n\t\t</link>\n\t</delchatroommember>\n</sysmsg>\n',
//     data         : '',
//     fromUser     : '3453262102@chatroom',
//     messageId    : '4030118997146183783',
//     messageSource: '',
//     messageType  : 10002,
//     status       : 1,
//     timestamp    : 1528755135,
//     toUser       : 'wxid_5zj4i5htp9ih22',
//   }

//   const EXPECTED_PAYLOAD: MessagePayload = {
//     fromId       : undefined,
//     id           : '4030118997146183783',
//     mentionIdList: undefined,
//     roomId       : '3453262102@chatroom',
//     text         : '<sysmsg type="delchatroommember">\n\t<delchatroommember>\n\t\t<plain><![CDATA[You invited . 李 卓 桓 .呵呵 to the group chat.   ]]></plain>\n\t\t<text><![CDATA[You invited . 李 卓 桓 .呵呵 to the group chat.   ]]></text>\n\t\t<link>\n\t\t\t<scene>invite</scene>\n\t\t\t<text><![CDATA[  Revoke]]></text>\n\t\t\t<memberlist>\n\t\t\t\t<username><![CDATA[wxid_a8d806dzznm822]]></username>\n\t\t\t</memberlist>\n\t\t</link>\n\t</delchatroommember>\n</sysmsg>\n',
//     timestamp    : 1528755135,
//     toId         : 'wxid_5zj4i5htp9ih22',
//     type         : 0,
//   }

//   const payload = await messageRawPayloadParser(MESSAGE_PAYLOAD)

//   t.deepEqual(payload, EXPECTED_PAYLOAD, 'should parse room invitation message payload')
// })

// test('room ownership transfer message', async t => {
//   const MESSAGE_PAYLOAD: MacproMessagePayload = {
//     content      : '你已成为新群主',
//     data         : '',
//     fromUser     : '6350854677@chatroom',
//     messageId    : '3798725634572049107',
//     messageSource: '',
//     messageType  : 10000,
//     status       : 1,
//     timestamp    : 1527689361,
//     toUser       : 'wxid_zj2cahpwzgie12',
//   }

//   const EXPECTED_PAYLOAD: MessagePayload = {
//     fromId       : undefined,
//     id           : '3798725634572049107',
//     mentionIdList: undefined,
//     roomId       : '6350854677@chatroom',
//     text         : '你已成为新群主',
//     timestamp    : 1527689361,
//     toId         : 'wxid_zj2cahpwzgie12',
//     type         : 0,
//   }

//   const payload = await messageRawPayloadParser(MESSAGE_PAYLOAD)
//   t.deepEqual(payload, EXPECTED_PAYLOAD, 'should parse ower transfer message')
// })

// test('StatusNotify to roomId', async t => {
//   const MESSAGE_PAYLOAD: MacproMessagePayload = {
//     content      : '<msg>\n<op id=\'5\'>\n<username>5367653125@chatroom</username>\n</op>\n</msg>',
//     data         : '',
//     fromUser     : 'wxid_5zj4i5htp9ih22',
//     messageId    : '179056144527271247',
//     messageSource: '',
//     messageType  : 51,
//     status       : 1,
//     timestamp    : 1528920139,
//     toUser       : '5367653125@chatroom',
//   }
//   const EXPECTED_PAYLOAD = {
//     fromId       : 'wxid_5zj4i5htp9ih22',
//     id           : '179056144527271247',
//     mentionIdList: undefined,
//     roomId       : '5367653125@chatroom',
//     text         : '<msg>\n<op id=\'5\'>\n<username>5367653125@chatroom</username>\n</op>\n</msg>',
//     timestamp    : 1528920139,
//     toId         : undefined,
//     type         : 0,
//   }

//   const payload = await messageRawPayloadParser(MESSAGE_PAYLOAD)
//   t.deepEqual(payload, EXPECTED_PAYLOAD, 'should parse status notify message to room id')
// })

// test('share card peer to peer', async t => {
//   const MESSAGE_PAYLOAD: MacproMessagePayload = {
//     content      : '<?xml version="1.0"?>\n<msg bigheadimgurl="http://wx.qlogo.cn/mmhead/ver_1/27zgBIIcxGmtINOWjoXPZ7yIsvfuIzGepXbcWUFyUHSK2N8MA2x1VkTZLzk9iaQca6CtPR6ooUZWR52icTwnia51A/0" smallheadimgurl="http://wx.qlogo.cn/mmhead/ver_1/27zgBIIcxGmtINOWjoXPZ7yIsvfuIzGepXbcWUFyUHSK2N8MA2x1VkTZLzk9iaQca6CtPR6ooUZWR52icTwnia51A/132" username="v1_cebe1d0a6ff469f5d1bc136ffd69929605f8e90cbefc2a42a81f53b3c90ee264@stranger" nickname="李佳芮" fullpy="李佳芮" shortpy="LJR" alias="" imagestatus="0" scene="17" province="北京" city="海淀" sign="" sex="2" certflag="0" certinfo="" brandIconUrl="" brandHomeUrl="" brandSubscriptConfigUrl="" brandFlags="0" regionCode="CN_Beijing_Haidian" antispamticket="v2_93b56e18c355bdbec761e459231b7e6ded4b0c4861a88f3ead9b2c89bce028fa56f345d8e7cf5479dc94a6e13b5b42ec@stranger"/>\n',
//     data         : '',
//     fromUser     : 'lizhuohuan',
//     messageId    : '5911987709823889005',
//     messageSource: '',
//     messageType  : 42,
//     status       : 1,
//     timestamp    : 1528959169,
//     toUser       : 'wxid_5zj4i5htp9ih22',
//   }
//   const EXPECTED_PAYLOAD: MessagePayload = {
//     fromId       : 'lizhuohuan',
//     id           : '5911987709823889005',
//     mentionIdList: undefined,
//     roomId       : undefined,
//     text         : '<?xml version="1.0"?>\n<msg bigheadimgurl="http://wx.qlogo.cn/mmhead/ver_1/27zgBIIcxGmtINOWjoXPZ7yIsvfuIzGepXbcWUFyUHSK2N8MA2x1VkTZLzk9iaQca6CtPR6ooUZWR52icTwnia51A/0" smallheadimgurl="http://wx.qlogo.cn/mmhead/ver_1/27zgBIIcxGmtINOWjoXPZ7yIsvfuIzGepXbcWUFyUHSK2N8MA2x1VkTZLzk9iaQca6CtPR6ooUZWR52icTwnia51A/132" username="v1_cebe1d0a6ff469f5d1bc136ffd69929605f8e90cbefc2a42a81f53b3c90ee264@stranger" nickname="李佳芮" fullpy="李佳芮" shortpy="LJR" alias="" imagestatus="0" scene="17" province="北京" city="海淀" sign="" sex="2" certflag="0" certinfo="" brandIconUrl="" brandHomeUrl="" brandSubscriptConfigUrl="" brandFlags="0" regionCode="CN_Beijing_Haidian" antispamticket="v2_93b56e18c355bdbec761e459231b7e6ded4b0c4861a88f3ead9b2c89bce028fa56f345d8e7cf5479dc94a6e13b5b42ec@stranger"/>\n',
//     timestamp    : 1528959169,
//     toId         : 'wxid_5zj4i5htp9ih22',
//     type         : 3,
//   }

//   const payload = await messageRawPayloadParser(MESSAGE_PAYLOAD)
//   t.deepEqual(payload, EXPECTED_PAYLOAD, 'should parse share card message peer to peer')
// })

// test('share card in room', async t => {
//   const MESSAGE_PAYLOAD: MacproMessagePayload = {
//     content      : 'lizhuohuan:\n<?xml version="1.0"?>\n<msg bigheadimgurl="http://wx.qlogo.cn/mmhead/ver_1/27zgBIIcxGmtINOWjoXPZ7yIsvfuIzGepXbcWUFyUHSK2N8MA2x1VkTZLzk9iaQca6CtPR6ooUZWR52icTwnia51A/0" smallheadimgurl="http://wx.qlogo.cn/mmhead/ver_1/27zgBIIcxGmtINOWjoXPZ7yIsvfuIzGepXbcWUFyUHSK2N8MA2x1VkTZLzk9iaQca6CtPR6ooUZWR52icTwnia51A/132" username="v1_cebe1d0a6ff469f5d1bc136ffd69929605f8e90cbefc2a42a81f53b3c90ee264@stranger" nickname="李佳芮" fullpy="李佳芮" shortpy="LJR" alias="" imagestatus="0" scene="17" province="北京" city="海淀" sign="" sex="2" certflag="0" certinfo="" brandIconUrl="" brandHomeUrl="" brandSubscriptConfigUrl="" brandFlags="0" regionCode="CN_Beijing_Haidian" antispamticket="v2_93b56e18c355bdbec761e459231b7e6db1ed42e77e0315ea11fb27d92b0641b586bd45a67c9c282b7a6c17430f15c0c3@stranger" />\n',
//     data         : '',
//     fromUser     : '3453262102@chatroom',
//     messageId    : '7332176666514216982',
//     messageSource: '<msgsource>\n\t<silence>0</silence>\n\t<membercount>3</membercount>\n</msgsource>\n',
//     messageType  : 42,
//     status       : 1,
//     timestamp    : 1528961383,
//     toUser       : 'wxid_5zj4i5htp9ih22',
//   }

//   const EXPECTED_PAYLOAD: MessagePayload = {
//     fromId       : 'lizhuohuan',
//     id           : '7332176666514216982',
//     mentionIdList: undefined,
//     roomId       : '3453262102@chatroom',
//     text         : '<?xml version="1.0"?>\n<msg bigheadimgurl="http://wx.qlogo.cn/mmhead/ver_1/27zgBIIcxGmtINOWjoXPZ7yIsvfuIzGepXbcWUFyUHSK2N8MA2x1VkTZLzk9iaQca6CtPR6ooUZWR52icTwnia51A/0" smallheadimgurl="http://wx.qlogo.cn/mmhead/ver_1/27zgBIIcxGmtINOWjoXPZ7yIsvfuIzGepXbcWUFyUHSK2N8MA2x1VkTZLzk9iaQca6CtPR6ooUZWR52icTwnia51A/132" username="v1_cebe1d0a6ff469f5d1bc136ffd69929605f8e90cbefc2a42a81f53b3c90ee264@stranger" nickname="李佳芮" fullpy="李佳芮" shortpy="LJR" alias="" imagestatus="0" scene="17" province="北京" city="海淀" sign="" sex="2" certflag="0" certinfo="" brandIconUrl="" brandHomeUrl="" brandSubscriptConfigUrl="" brandFlags="0" regionCode="CN_Beijing_Haidian" antispamticket="v2_93b56e18c355bdbec761e459231b7e6db1ed42e77e0315ea11fb27d92b0641b586bd45a67c9c282b7a6c17430f15c0c3@stranger" />\n',
//     timestamp    : 1528961383,
//     toId         : 'wxid_5zj4i5htp9ih22',
//     type         : 3,
//   }

//   const payload = await messageRawPayloadParser(MESSAGE_PAYLOAD)
//   t.deepEqual(payload, EXPECTED_PAYLOAD, 'should parse share card message peer to peer')
// })

// test('recalled message in room', async t => {
//   const MESSAGE_PAYLOAD: MacproMessagePayload = {
//     content: '<sysmsg type="revokemsg">\n\t<revokemsg>\n\t\t<session>lylezhuifeng</session>\n\t\t<msgid>1062840803</msgid>\n\t\t<newmsgid>2244146148648143901</newmsgid>\n\t\t<replacemsg><![CDATA["高原ོ" 撤回了一条消息]]></replacemsg>\n\t</revokemsg>\n</sysmsg>\n',
//     data: null,
//     fromUser: 'lylezhuifeng',
//     messageId: '1062840804',
//     messageSource: '',
//     messageType: 10002,
//     status: 4,
//     timestamp: 1553853738,
//     toUser: 'wxid_zovb9ol86m7l22',
//   }

//   const EXPECTED_PAYLOAD: MessagePayload = {
//     fromId: 'lylezhuifeng',
//     id: '1062840804',
//     mentionIdList: undefined,
//     roomId: undefined,
//     text: '1062840803',
//     timestamp: 1553853738,
//     toId: 'wxid_zovb9ol86m7l22',
//     type: 11,
//   }
//   const payload = await messageRawPayloadParser(MESSAGE_PAYLOAD)
//   t.deepEqual(payload, EXPECTED_PAYLOAD, 'should parse recalled message in room')
// })

// test('Official account sent url', async t => {
//   const MESSAGE_PAYLOAD: MacproMessagePayload = {
//     content: '<msg><appmsg appid="" sdkver="0"><title><![CDATA[这是一个测试的图文消息]]></title><des><![CDATA[其实没有正文]]></des><action></action><type>5</type><showtype>1</showtype><soundtype>0</soundtype><content><![CDATA[]]></content><contentattr>0</contentattr><url><![CDATA[http://mp.weixin.qq.com/s?__biz=MzUyMjI2ODExNQ==&mid=100000004&idx=1&sn=c5d12a1d2be5937203967104a83b750e&chksm=79cf3db84eb8b4aed4b6ab0fab5a3a1bbde63987979ac0cb42255200e4c6aaf85b8f56787564&scene=0&xtrack=1#rd]]></url><lowurl><![CDATA[]]></lowurl><appattach><totallen>0</totallen><attachid></attachid><fileext></fileext><cdnthumburl><![CDATA[]]></cdnthumburl><cdnthumbaeskey><![CDATA[]]></cdnthumbaeskey><aeskey><![CDATA[]]></aeskey></appattach><extinfo></extinfo><sourceusername><![CDATA[]]></sourceusername><sourcedisplayname><![CDATA[]]></sourcedisplayname><mmreader><category type="20" count="1"><name><![CDATA[桔小秘]]></name><topnew><cover><![CDATA[http://mmbiz.qpic.cn/mmbiz_jpg/97GegGKVAeEof3ibgT4Pso8OkLTUNcJIm3bAdx94JV14iacf3HbibkDGfAs2UlR0xETHnhQnOPMkex0Srb25vIkAA/640?wxtype=jpeg&wxfrom=0]]></cover><width>0</width><height>0</height><digest><![CDATA[其实没有正文]]></digest></topnew><item><itemshowtype>0</itemshowtype><title><![CDATA[这是一个测试的图文消息]]></title><url><![CDATA[http://mp.weixin.qq.com/s?__biz=MzUyMjI2ODExNQ==&mid=100000004&idx=1&sn=c5d12a1d2be5937203967104a83b750e&chksm=79cf3db84eb8b4aed4b6ab0fab5a3a1bbde63987979ac0cb42255200e4c6aaf85b8f56787564&scene=0&xtrack=1#rd]]></url><shorturl><![CDATA[]]></shorturl><longurl><![CDATA[]]></longurl><pub_time>1559707865</pub_time><cover><![CDATA[http://mmbiz.qpic.cn/mmbiz_jpg/97GegGKVAeEof3ibgT4Pso8OkLTUNcJIm3bAdx94JV14iacf3HbibkDGfAs2UlR0xETHnhQnOPMkex0Srb25vIkAA/640?wxtype=jpeg&wxfrom=0|0|0]]></cover><tweetid></tweetid><digest><![CDATA[其实没有正文]]></digest><fileid>100000002</fileid><sources><source><name><![CDATA[桔小秘]]></name></source></sources><styles></styles><native_url></native_url><del_flag>0</del_flag><contentattr>0</contentattr><play_length>0</play_length><play_url><![CDATA[]]></play_url><player><![CDATA[]]></player><template_op_type>0</template_op_type><weapp_username><![CDATA[]]></weapp_username><weapp_path><![CDATA[]]></weapp_path><weapp_version>0</weapp_version><weapp_state>0</weapp_state><music_source>0</music_source><pic_num>0</pic_num><show_complaint_button>0</show_complaint_button><vid><![CDATA[]]></vid><recommendation><![CDATA[]]></recommendation><pic_urls></pic_urls><comment_topic_id>0</comment_topic_id><cover_235_1><![CDATA[https://mmbiz.qlogo.cn/mmbiz_jpg/97GegGKVAeEof3ibgT4Pso8OkLTUNcJIm3bAdx94JV14iacf3HbibkDGfAs2UlR0xETHnhQnOPMkex0Srb25vIkAA/0?wx_fmt=jpeg&wxtype=jpeg&wxfrom=0|0|0]]></cover_235_1><cover_1_1><![CDATA[https://mmbiz.qlogo.cn/mmbiz_jpg/97GegGKVAeEof3ibgT4Pso8OkLTUNcJImBzbaibFQRBTEGjHFmNjF0P3BjdyjAe7a985o3b8zWFNH6fLEXH6ficiaQ/0?wx_fmt=jpeg&wxtype=jpeg&wxfrom=0|0|0]]></cover_1_1><appmsg_like_type>2</appmsg_like_type><video_width>0</video_width><video_height>0</video_height></item></category><publisher><username><![CDATA[gh_87e03c422b73]]></username><nickname><![CDATA[桔小秘]]></nickname></publisher><template_header></template_header><template_detail></template_detail><forbid_forward>0</forbid_forward></mmreader><thumburl><![CDATA[http://mmbiz.qpic.cn/mmbiz_jpg/97GegGKVAeEof3ibgT4Pso8OkLTUNcJIm3bAdx94JV14iacf3HbibkDGfAs2UlR0xETHnhQnOPMkex0Srb25vIkAA/640?wxtype=jpeg&wxfrom=0]]></thumburl></appmsg><fromusername><![CDATA[gh_87e03c422b73]]></fromusername><appinfo><version>0</version><appname><![CDATA[桔小秘]]></appname><isforceupdate>1</isforceupdate></appinfo></msg>',
//     data: null,
//     fromUser: 'gh_87e03c422b73',
//     messageId: '1006688399',
//     messageSource: '<msgsource>\n\t<tips>3</tips>\n\t<bizmsg>\n\t\t<bizmsgshowtype>0</bizmsgshowtype>\n\t\t<bizmsgfromuser><![CDATA[gh_87e03c422b73]]></bizmsgfromuser>\n\t</bizmsg>\n\t<msg_cluster_type>0</msg_cluster_type>\n\t<service_type>1</service_type>\n\t<scene>1</scene>\n</msgsource>\n',
//     messageType: 49,
//     status: 3,
//     timestamp: 1559707890,
//     toUser: 'wxid_x01jgln69ath22',
//   }

//   const EXPECTED_PAYLOAD: MessagePayload = {
//     filename: '1006688399-to-be-implement.txt',
//     fromId: 'gh_87e03c422b73',
//     id: '1006688399',
//     mentionIdList: undefined,
//     roomId: undefined,
//     text: '<msg><appmsg appid="" sdkver="0"><title><![CDATA[这是一个测试的图文消息]]></title><des><![CDATA[其实没有正文]]></des><action></action><type>5</type><showtype>1</showtype><soundtype>0</soundtype><content><![CDATA[]]></content><contentattr>0</contentattr><url><![CDATA[http://mp.weixin.qq.com/s?__biz=MzUyMjI2ODExNQ==&mid=100000004&idx=1&sn=c5d12a1d2be5937203967104a83b750e&chksm=79cf3db84eb8b4aed4b6ab0fab5a3a1bbde63987979ac0cb42255200e4c6aaf85b8f56787564&scene=0&xtrack=1#rd]]></url><lowurl><![CDATA[]]></lowurl><appattach><totallen>0</totallen><attachid></attachid><fileext></fileext><cdnthumburl><![CDATA[]]></cdnthumburl><cdnthumbaeskey><![CDATA[]]></cdnthumbaeskey><aeskey><![CDATA[]]></aeskey></appattach><extinfo></extinfo><sourceusername><![CDATA[]]></sourceusername><sourcedisplayname><![CDATA[]]></sourcedisplayname><mmreader><category type="20" count="1"><name><![CDATA[桔小秘]]></name><topnew><cover><![CDATA[http://mmbiz.qpic.cn/mmbiz_jpg/97GegGKVAeEof3ibgT4Pso8OkLTUNcJIm3bAdx94JV14iacf3HbibkDGfAs2UlR0xETHnhQnOPMkex0Srb25vIkAA/640?wxtype=jpeg&wxfrom=0]]></cover><width>0</width><height>0</height><digest><![CDATA[其实没有正文]]></digest></topnew><item><itemshowtype>0</itemshowtype><title><![CDATA[这是一个测试的图文消息]]></title><url><![CDATA[http://mp.weixin.qq.com/s?__biz=MzUyMjI2ODExNQ==&mid=100000004&idx=1&sn=c5d12a1d2be5937203967104a83b750e&chksm=79cf3db84eb8b4aed4b6ab0fab5a3a1bbde63987979ac0cb42255200e4c6aaf85b8f56787564&scene=0&xtrack=1#rd]]></url><shorturl><![CDATA[]]></shorturl><longurl><![CDATA[]]></longurl><pub_time>1559707865</pub_time><cover><![CDATA[http://mmbiz.qpic.cn/mmbiz_jpg/97GegGKVAeEof3ibgT4Pso8OkLTUNcJIm3bAdx94JV14iacf3HbibkDGfAs2UlR0xETHnhQnOPMkex0Srb25vIkAA/640?wxtype=jpeg&wxfrom=0|0|0]]></cover><tweetid></tweetid><digest><![CDATA[其实没有正文]]></digest><fileid>100000002</fileid><sources><source><name><![CDATA[桔小秘]]></name></source></sources><styles></styles><native_url></native_url><del_flag>0</del_flag><contentattr>0</contentattr><play_length>0</play_length><play_url><![CDATA[]]></play_url><player><![CDATA[]]></player><template_op_type>0</template_op_type><weapp_username><![CDATA[]]></weapp_username><weapp_path><![CDATA[]]></weapp_path><weapp_version>0</weapp_version><weapp_state>0</weapp_state><music_source>0</music_source><pic_num>0</pic_num><show_complaint_button>0</show_complaint_button><vid><![CDATA[]]></vid><recommendation><![CDATA[]]></recommendation><pic_urls></pic_urls><comment_topic_id>0</comment_topic_id><cover_235_1><![CDATA[https://mmbiz.qlogo.cn/mmbiz_jpg/97GegGKVAeEof3ibgT4Pso8OkLTUNcJIm3bAdx94JV14iacf3HbibkDGfAs2UlR0xETHnhQnOPMkex0Srb25vIkAA/0?wx_fmt=jpeg&wxtype=jpeg&wxfrom=0|0|0]]></cover_235_1><cover_1_1><![CDATA[https://mmbiz.qlogo.cn/mmbiz_jpg/97GegGKVAeEof3ibgT4Pso8OkLTUNcJImBzbaibFQRBTEGjHFmNjF0P3BjdyjAe7a985o3b8zWFNH6fLEXH6ficiaQ/0?wx_fmt=jpeg&wxtype=jpeg&wxfrom=0|0|0]]></cover_1_1><appmsg_like_type>2</appmsg_like_type><video_width>0</video_width><video_height>0</video_height></item></category><publisher><username><![CDATA[gh_87e03c422b73]]></username><nickname><![CDATA[桔小秘]]></nickname></publisher><template_header></template_header><template_detail></template_detail><forbid_forward>0</forbid_forward></mmreader><thumburl><![CDATA[http://mmbiz.qpic.cn/mmbiz_jpg/97GegGKVAeEof3ibgT4Pso8OkLTUNcJIm3bAdx94JV14iacf3HbibkDGfAs2UlR0xETHnhQnOPMkex0Srb25vIkAA/640?wxtype=jpeg&wxfrom=0]]></thumburl></appmsg><fromusername><![CDATA[gh_87e03c422b73]]></fromusername><appinfo><version>0</version><appname><![CDATA[桔小秘]]></appname><isforceupdate>1</isforceupdate></appinfo></msg>',
//     timestamp: 1559707890,
//     toId: 'wxid_x01jgln69ath22',
//     type: 12,
//   }
//   const payload = await messageRawPayloadParser(MESSAGE_PAYLOAD)
//   t.deepEqual(payload, EXPECTED_PAYLOAD, 'should parse official account sent url.')
// })

// test('Special Official account sent url', async t => {
//   const MESSAGE_PAYLOAD = {
//     content: '<msg>\n    <appmsg appid="" sdkver="0">\n        <title><![CDATA[“演员”孙宇晨]]></title>\n        <des><![CDATA[孙宇晨身上有多个标签，如果一定要定义，他更像是一个成功的创业演员。]]></des>\n        <action></action>\n        <type>5</type>\n        <showtype>1</showtype>\n        <content><![CDATA[]]></content>\n        <contentattr>0</contentattr>\n        <url><![CDATA[http://mp.weixin.qq.com/s?__biz=MTA3NDM1MzUwMQ==&mid=2651981644&idx=1&sn=d6853c6c0f15466909ad51a5c3833ddd&chksm=73d0057e44a78c682619d70077828ced5dc242e82da1e9434c134f289e4d7d4d7fc1d9a6557d&scene=0&xtrack=1#rd]]></url>\n        <lowurl><![CDATA[]]></lowurl>\n        <appattach>\n            <totallen>0</totallen>\n            <attachid></attachid>\n            <fileext></fileext>\n        </appattach>\n        <extinfo></extinfo>\n        <mmreader>\n            <category type="20" count="3">\n                <name><![CDATA[i黑马]]></name>\n                <topnew>\n                    <cover><![CDATA[http://mmbiz.qpic.cn/mmbiz_jpg/unsMtmapdG4PBozGcHBgT3R09icvPvicjwnftiboUWD6pw8fa6Ab4tw9psUdTVeaoZqvic2JNlUylafRCok0ALY48w/640?wxtype=jpeg&wxfrom=0]]></cover>\n                    <width>0</width>\n                    <height>0</height>\n                    <digest><![CDATA[]]></digest>\n                </topnew>\n                \n                <item>\n                    <itemshowtype>0</itemshowtype>\n                    <title><![CDATA[“演员”孙宇晨]]></title>\n                    <url><![CDATA[http://mp.weixin.qq.com/s?__biz=MTA3NDM1MzUwMQ==&mid=2651981644&idx=1&sn=d6853c6c0f15466909ad51a5c3833ddd&chksm=73d0057e44a78c682619d70077828ced5dc242e82da1e9434c134f289e4d7d4d7fc1d9a6557d&scene=0&xtrack=1#rd]]></url>\n                    <shorturl><![CDATA[]]></shorturl>\n                    <longurl><![CDATA[]]></longurl>\n                    <pub_time>1559707142</pub_time>\n                    <cover><![CDATA[http://mmbiz.qpic.cn/mmbiz_jpg/unsMtmapdG4PBozGcHBgT3R09icvPvicjwnftiboUWD6pw8fa6Ab4tw9psUdTVeaoZqvic2JNlUylafRCok0ALY48w/640?wxtype=jpeg&wxfrom=0]]></cover>\n                    <tweetid></tweetid>\n                    <digest><![CDATA[孙宇晨身上有多个标签，如果一定要定义，他更像是一个成功的创业演员。]]></digest>\n                    <fileid>504497991</fileid>\n                    <sources>\n                        <source>\n                            <name><![CDATA[i黑马]]></name>\n                        </source>\n                    </sources>\n                    <styles></styles>\n                    <native_url></native_url>\n                    <del_flag>0</del_flag>\n                    <contentattr>0</contentattr>\n                    <play_length>0</play_length>\n                    <play_url><![CDATA[]]></play_url>\n                    <player><![CDATA[]]></player>\n                    <music_source>0</music_source>\n                    <pic_num>0</pic_num>\n                    <vid></vid>\n                    <author><![CDATA[]]></author>\n                    <recommendation><![CDATA[]]></recommendation>\n                    <pic_urls></pic_urls>\n                    <comment_topic_id>840787998215241730</comment_topic_id>\n                    <cover_235_1><![CDATA[http://mmbiz.qpic.cn/mmbiz_jpg/unsMtmapdG4PBozGcHBgT3R09icvPvicjwnftiboUWD6pw8fa6Ab4tw9psUdTVeaoZqvic2JNlUylafRCok0ALY48w/640?wx_fmt=jpeg&wxtype=jpeg&wxfrom=0]]></cover_235_1>\n                    <cover_1_1><![CDATA[http://mmbiz.qpic.cn/mmbiz_jpg/unsMtmapdG4PBozGcHBgT3R09icvPvicjwkpDqDNz993sQ9gCrMDGdWFbcgFI6VEqjDaSib64f9qFUhFpgrumJNaQ/640?wx_fmt=jpeg&wxtype=jpeg&wxfrom=0]]></cover_1_1>\n                    <appmsg_like_type>2</appmsg_like_type>\n                    <video_width>0</video_width>\n                    <video_height>0</video_height>\n                </item>\n                \n                <item>\n                    <itemshowtype>0</itemshowtype>\n                    <title><![CDATA[深创投孙东升：专业化是本土创投转型升级的必由之路]]></title>\n                    <url><![CDATA[http://mp.weixin.qq.com/s?__biz=MTA3NDM1MzUwMQ==&mid=2651981644&idx=2&sn=381549b29d86e05b34d4459faf5ba76e&chksm=73d0057e44a78c6801d1b1c39da099d6db7b1ae796dc976b0d3faeb5a22bc61599c4c3e84422&scene=0&xtrack=1#rd]]></url>\n                    <shorturl><![CDATA[]]></shorturl>\n                    <longurl><![CDATA[]]></longurl>\n                    <pub_time>1559707142</pub_time>\n                    <cover><![CDATA[http://mmbiz.qpic.cn/mmbiz_jpg/unsMtmapdG4PBozGcHBgT3R09icvPvicjwXpyicdicH1OkfXRdxBk4cWJ5LF6MiaO7VtNz6F0zaLjx6l7lquXN0jbyA/300?wxtype=jpeg&wxfrom=0]]></cover>\n                    <tweetid></tweetid>\n                    <digest><![CDATA[深圳创投帮不追热点、重技术创新，投资主要集中于智能制造、生物医药、新一代通讯技术、新材料等硬科技项目。]]></digest>\n                    <fileid>504497993</fileid>\n                    <sources>\n                        <source>\n                            <name><![CDATA[i黑马]]></name>\n                        </source>\n                    </sources>\n                    <styles></styles>\n                    <native_url></native_url>\n                    <del_flag>0</del_flag>\n                    <contentattr>0</contentattr>\n                    <play_length>0</play_length>\n                    <play_url><![CDATA[]]></play_url>\n                    <player><![CDATA[]]></player>\n                    <music_source>0</music_source>\n                    <pic_num>0</pic_num>\n                    <vid></vid>\n                    <author><![CDATA[]]></author>\n                    <recommendation><![CDATA[]]></recommendation>\n                    <pic_urls></pic_urls>\n                    <comment_topic_id>840787998986993664</comment_topic_id>\n                    <cover_235_1><![CDATA[http://mmbiz.qpic.cn/mmbiz_jpg/unsMtmapdG4PBozGcHBgT3R09icvPvicjwXpyicdicH1OkfXRdxBk4cWJ5LF6MiaO7VtNz6F0zaLjx6l7lquXN0jbyA/640?wx_fmt=jpeg&wxtype=jpeg&wxfrom=0]]></cover_235_1>\n                    <cover_1_1><![CDATA[http://mmbiz.qpic.cn/mmbiz_jpg/unsMtmapdG4PBozGcHBgT3R09icvPvicjwXpyicdicH1OkfXRdxBk4cWJ5LF6MiaO7VtNz6F0zaLjx6l7lquXN0jbyA/640?wx_fmt=jpeg&wxtype=jpeg&wxfrom=0]]></cover_1_1>\n                    <appmsg_like_type>2</appmsg_like_type>\n                    <video_width>0</video_width>\n                    <video_height>0</video_height>\n                </item>\n                \n                <item>\n                    <itemshowtype>0</itemshowtype>\n                    <title><![CDATA[松禾资本厉伟：老老实实做生意]]></title>\n                    <url><![CDATA[http://mp.weixin.qq.com/s?__biz=MTA3NDM1MzUwMQ==&mid=2651981644&idx=3&sn=efda768aa069ae00df91a2b899127ccf&chksm=73d0057e44a78c686c851673d132dd009646c561ad2a2faa87a8c0f56bb682613298640aa0c8&scene=0&xtrack=1#rd]]></url>\n                    <shorturl><![CDATA[]]></shorturl>\n                    <longurl><![CDATA[]]></longurl>\n                    <pub_time>1559707142</pub_time>\n                    <cover><![CDATA[http://mmbiz.qpic.cn/mmbiz_jpg/unsMtmapdG4PBozGcHBgT3R09icvPvicjwZFEMkxmSDmkUgh1qMHdbeEoPyYJrS9QM4Ziajmavln9UK7WMRGFhVYQ/300?wxtype=jpeg&wxfrom=0]]></cover>\n                    <tweetid></tweetid>\n                    <digest><![CDATA[深圳创投帮已成为中国风投界主流，他们投资的技术企业也成为中国技术创新的中流砥柱。]]></digest>\n                    <fileid>504497994</fileid>\n                    <sources>\n                        <source>\n                            <name><![CDATA[i黑马]]></name>\n                        </source>\n                    </sources>\n                    <styles></styles>\n                    <native_url></native_url>\n                    <del_flag>0</del_flag>\n                    <contentattr>0</contentattr>\n                    <play_length>0</play_length>\n                    <play_url><![CDATA[]]></play_url>\n                    <player><![CDATA[]]></player>\n                    <music_source>0</music_source>\n                    <pic_num>0</pic_num>\n                    <vid></vid>\n                    <author><![CDATA[]]></author>\n                    <recommendation><![CDATA[]]></recommendation>\n                    <pic_urls></pic_urls>\n                    <comment_topic_id>840787999741968385</comment_topic_id>\n                    <cover_235_1><![CDATA[http://mmbiz.qpic.cn/mmbiz_jpg/unsMtmapdG4PBozGcHBgT3R09icvPvicjwZFEMkxmSDmkUgh1qMHdbeEoPyYJrS9QM4Ziajmavln9UK7WMRGFhVYQ/640?wx_fmt=jpeg&wxtype=jpeg&wxfrom=0]]></cover_235_1>\n                    <cover_1_1><![CDATA[http://mmbiz.qpic.cn/mmbiz_jpg/unsMtmapdG4PBozGcHBgT3R09icvPvicjwZFEMkxmSDmkUgh1qMHdbeEoPyYJrS9QM4Ziajmavln9UK7WMRGFhVYQ/640?wx_fmt=jpeg&wxtype=jpeg&wxfrom=0]]></cover_1_1>\n                    <appmsg_like_type>2</appmsg_like_type>\n                    <video_width>0</video_width>\n                    <video_height>0</video_height>\n                </item>\n                \n            </category>\n            <publisher>\n                <username><![CDATA[wxid_2965349653612]]></username>\n                <nickname><![CDATA[i黑马]]></nickname>\n            </publisher>\n            <template_header></template_header>\n            <template_detail></template_detail>\n            <forbid_forward>0</forbid_forward>\n        </mmreader>\n        <thumburl><![CDATA[http://mmbiz.qpic.cn/mmbiz_jpg/unsMtmapdG4PBozGcHBgT3R09icvPvicjwnftiboUWD6pw8fa6Ab4tw9psUdTVeaoZqvic2JNlUylafRCok0ALY48w/640?wxtype=jpeg&wxfrom=0]]></thumburl>\n    </appmsg>\n    <fromusername><![CDATA[wxid_2965349653612]]></fromusername>\n    <appinfo>\n        <version></version>\n        <appname><![CDATA[i黑马]]></appname>\n        <isforceupdate>1</isforceupdate>\n    </appinfo>\n    \n    \n    \n    \n    \n    \n</msg>',
//     data: null,
//     fromUser: 'wxid_2965349653612',
//     messageId: '1601417885',
//     messageSource: '<msgsource>\n\t<bizmsg>\n\t\t<bizclientmsgid><![CDATA[mmbizcluster_1_1074353501_1000002540]]></bizclientmsgid>\n\t\t<msg_predict>0</msg_predict>\n\t</bizmsg>\n\t<bizflag>0</bizflag>\n\t<msg_cluster_type>3</msg_cluster_type>\n\t<service_type>0</service_type>\n</msgsource>\n',
//     messageType: 49,
//     status: 3,
//     timestamp: 1559707752,
//     toUser: 'wxid_x01jgln69ath22',
//   }

//   const EXPECTED_PAYLOAD: MessagePayload = {
//     filename: '1601417885-to-be-implement.txt',
//     fromId: 'wxid_2965349653612',
//     id: '1601417885',
//     mentionIdList: undefined,
//     roomId: undefined,
//     text: '<msg>\n    <appmsg appid="" sdkver="0">\n        <title><![CDATA[“演员”孙宇晨]]></title>\n        <des><![CDATA[孙宇晨身上有多个标签，如果一定要定义，他更像是一个成功的创业演员。]]></des>\n        <action></action>\n        <type>5</type>\n        <showtype>1</showtype>\n        <content><![CDATA[]]></content>\n        <contentattr>0</contentattr>\n        <url><![CDATA[http://mp.weixin.qq.com/s?__biz=MTA3NDM1MzUwMQ==&mid=2651981644&idx=1&sn=d6853c6c0f15466909ad51a5c3833ddd&chksm=73d0057e44a78c682619d70077828ced5dc242e82da1e9434c134f289e4d7d4d7fc1d9a6557d&scene=0&xtrack=1#rd]]></url>\n        <lowurl><![CDATA[]]></lowurl>\n        <appattach>\n            <totallen>0</totallen>\n            <attachid></attachid>\n            <fileext></fileext>\n        </appattach>\n        <extinfo></extinfo>\n        <mmreader>\n            <category type="20" count="3">\n                <name><![CDATA[i黑马]]></name>\n                <topnew>\n                    <cover><![CDATA[http://mmbiz.qpic.cn/mmbiz_jpg/unsMtmapdG4PBozGcHBgT3R09icvPvicjwnftiboUWD6pw8fa6Ab4tw9psUdTVeaoZqvic2JNlUylafRCok0ALY48w/640?wxtype=jpeg&wxfrom=0]]></cover>\n                    <width>0</width>\n                    <height>0</height>\n                    <digest><![CDATA[]]></digest>\n                </topnew>\n                \n                <item>\n                    <itemshowtype>0</itemshowtype>\n                    <title><![CDATA[“演员”孙宇晨]]></title>\n                    <url><![CDATA[http://mp.weixin.qq.com/s?__biz=MTA3NDM1MzUwMQ==&mid=2651981644&idx=1&sn=d6853c6c0f15466909ad51a5c3833ddd&chksm=73d0057e44a78c682619d70077828ced5dc242e82da1e9434c134f289e4d7d4d7fc1d9a6557d&scene=0&xtrack=1#rd]]></url>\n                    <shorturl><![CDATA[]]></shorturl>\n                    <longurl><![CDATA[]]></longurl>\n                    <pub_time>1559707142</pub_time>\n                    <cover><![CDATA[http://mmbiz.qpic.cn/mmbiz_jpg/unsMtmapdG4PBozGcHBgT3R09icvPvicjwnftiboUWD6pw8fa6Ab4tw9psUdTVeaoZqvic2JNlUylafRCok0ALY48w/640?wxtype=jpeg&wxfrom=0]]></cover>\n                    <tweetid></tweetid>\n                    <digest><![CDATA[孙宇晨身上有多个标签，如果一定要定义，他更像是一个成功的创业演员。]]></digest>\n                    <fileid>504497991</fileid>\n                    <sources>\n                        <source>\n                            <name><![CDATA[i黑马]]></name>\n                        </source>\n                    </sources>\n                    <styles></styles>\n                    <native_url></native_url>\n                    <del_flag>0</del_flag>\n                    <contentattr>0</contentattr>\n                    <play_length>0</play_length>\n                    <play_url><![CDATA[]]></play_url>\n                    <player><![CDATA[]]></player>\n                    <music_source>0</music_source>\n                    <pic_num>0</pic_num>\n                    <vid></vid>\n                    <author><![CDATA[]]></author>\n                    <recommendation><![CDATA[]]></recommendation>\n                    <pic_urls></pic_urls>\n                    <comment_topic_id>840787998215241730</comment_topic_id>\n                    <cover_235_1><![CDATA[http://mmbiz.qpic.cn/mmbiz_jpg/unsMtmapdG4PBozGcHBgT3R09icvPvicjwnftiboUWD6pw8fa6Ab4tw9psUdTVeaoZqvic2JNlUylafRCok0ALY48w/640?wx_fmt=jpeg&wxtype=jpeg&wxfrom=0]]></cover_235_1>\n                    <cover_1_1><![CDATA[http://mmbiz.qpic.cn/mmbiz_jpg/unsMtmapdG4PBozGcHBgT3R09icvPvicjwkpDqDNz993sQ9gCrMDGdWFbcgFI6VEqjDaSib64f9qFUhFpgrumJNaQ/640?wx_fmt=jpeg&wxtype=jpeg&wxfrom=0]]></cover_1_1>\n                    <appmsg_like_type>2</appmsg_like_type>\n                    <video_width>0</video_width>\n                    <video_height>0</video_height>\n                </item>\n                \n                <item>\n                    <itemshowtype>0</itemshowtype>\n                    <title><![CDATA[深创投孙东升：专业化是本土创投转型升级的必由之路]]></title>\n                    <url><![CDATA[http://mp.weixin.qq.com/s?__biz=MTA3NDM1MzUwMQ==&mid=2651981644&idx=2&sn=381549b29d86e05b34d4459faf5ba76e&chksm=73d0057e44a78c6801d1b1c39da099d6db7b1ae796dc976b0d3faeb5a22bc61599c4c3e84422&scene=0&xtrack=1#rd]]></url>\n                    <shorturl><![CDATA[]]></shorturl>\n                    <longurl><![CDATA[]]></longurl>\n                    <pub_time>1559707142</pub_time>\n                    <cover><![CDATA[http://mmbiz.qpic.cn/mmbiz_jpg/unsMtmapdG4PBozGcHBgT3R09icvPvicjwXpyicdicH1OkfXRdxBk4cWJ5LF6MiaO7VtNz6F0zaLjx6l7lquXN0jbyA/300?wxtype=jpeg&wxfrom=0]]></cover>\n                    <tweetid></tweetid>\n                    <digest><![CDATA[深圳创投帮不追热点、重技术创新，投资主要集中于智能制造、生物医药、新一代通讯技术、新材料等硬科技项目。]]></digest>\n                    <fileid>504497993</fileid>\n                    <sources>\n                        <source>\n                            <name><![CDATA[i黑马]]></name>\n                        </source>\n                    </sources>\n                    <styles></styles>\n                    <native_url></native_url>\n                    <del_flag>0</del_flag>\n                    <contentattr>0</contentattr>\n                    <play_length>0</play_length>\n                    <play_url><![CDATA[]]></play_url>\n                    <player><![CDATA[]]></player>\n                    <music_source>0</music_source>\n                    <pic_num>0</pic_num>\n                    <vid></vid>\n                    <author><![CDATA[]]></author>\n                    <recommendation><![CDATA[]]></recommendation>\n                    <pic_urls></pic_urls>\n                    <comment_topic_id>840787998986993664</comment_topic_id>\n                    <cover_235_1><![CDATA[http://mmbiz.qpic.cn/mmbiz_jpg/unsMtmapdG4PBozGcHBgT3R09icvPvicjwXpyicdicH1OkfXRdxBk4cWJ5LF6MiaO7VtNz6F0zaLjx6l7lquXN0jbyA/640?wx_fmt=jpeg&wxtype=jpeg&wxfrom=0]]></cover_235_1>\n                    <cover_1_1><![CDATA[http://mmbiz.qpic.cn/mmbiz_jpg/unsMtmapdG4PBozGcHBgT3R09icvPvicjwXpyicdicH1OkfXRdxBk4cWJ5LF6MiaO7VtNz6F0zaLjx6l7lquXN0jbyA/640?wx_fmt=jpeg&wxtype=jpeg&wxfrom=0]]></cover_1_1>\n                    <appmsg_like_type>2</appmsg_like_type>\n                    <video_width>0</video_width>\n                    <video_height>0</video_height>\n                </item>\n                \n                <item>\n                    <itemshowtype>0</itemshowtype>\n                    <title><![CDATA[松禾资本厉伟：老老实实做生意]]></title>\n                    <url><![CDATA[http://mp.weixin.qq.com/s?__biz=MTA3NDM1MzUwMQ==&mid=2651981644&idx=3&sn=efda768aa069ae00df91a2b899127ccf&chksm=73d0057e44a78c686c851673d132dd009646c561ad2a2faa87a8c0f56bb682613298640aa0c8&scene=0&xtrack=1#rd]]></url>\n                    <shorturl><![CDATA[]]></shorturl>\n                    <longurl><![CDATA[]]></longurl>\n                    <pub_time>1559707142</pub_time>\n                    <cover><![CDATA[http://mmbiz.qpic.cn/mmbiz_jpg/unsMtmapdG4PBozGcHBgT3R09icvPvicjwZFEMkxmSDmkUgh1qMHdbeEoPyYJrS9QM4Ziajmavln9UK7WMRGFhVYQ/300?wxtype=jpeg&wxfrom=0]]></cover>\n                    <tweetid></tweetid>\n                    <digest><![CDATA[深圳创投帮已成为中国风投界主流，他们投资的技术企业也成为中国技术创新的中流砥柱。]]></digest>\n                    <fileid>504497994</fileid>\n                    <sources>\n                        <source>\n                            <name><![CDATA[i黑马]]></name>\n                        </source>\n                    </sources>\n                    <styles></styles>\n                    <native_url></native_url>\n                    <del_flag>0</del_flag>\n                    <contentattr>0</contentattr>\n                    <play_length>0</play_length>\n                    <play_url><![CDATA[]]></play_url>\n                    <player><![CDATA[]]></player>\n                    <music_source>0</music_source>\n                    <pic_num>0</pic_num>\n                    <vid></vid>\n                    <author><![CDATA[]]></author>\n                    <recommendation><![CDATA[]]></recommendation>\n                    <pic_urls></pic_urls>\n                    <comment_topic_id>840787999741968385</comment_topic_id>\n                    <cover_235_1><![CDATA[http://mmbiz.qpic.cn/mmbiz_jpg/unsMtmapdG4PBozGcHBgT3R09icvPvicjwZFEMkxmSDmkUgh1qMHdbeEoPyYJrS9QM4Ziajmavln9UK7WMRGFhVYQ/640?wx_fmt=jpeg&wxtype=jpeg&wxfrom=0]]></cover_235_1>\n                    <cover_1_1><![CDATA[http://mmbiz.qpic.cn/mmbiz_jpg/unsMtmapdG4PBozGcHBgT3R09icvPvicjwZFEMkxmSDmkUgh1qMHdbeEoPyYJrS9QM4Ziajmavln9UK7WMRGFhVYQ/640?wx_fmt=jpeg&wxtype=jpeg&wxfrom=0]]></cover_1_1>\n                    <appmsg_like_type>2</appmsg_like_type>\n                    <video_width>0</video_width>\n                    <video_height>0</video_height>\n                </item>\n                \n            </category>\n            <publisher>\n                <username><![CDATA[wxid_2965349653612]]></username>\n                <nickname><![CDATA[i黑马]]></nickname>\n            </publisher>\n            <template_header></template_header>\n            <template_detail></template_detail>\n            <forbid_forward>0</forbid_forward>\n        </mmreader>\n        <thumburl><![CDATA[http://mmbiz.qpic.cn/mmbiz_jpg/unsMtmapdG4PBozGcHBgT3R09icvPvicjwnftiboUWD6pw8fa6Ab4tw9psUdTVeaoZqvic2JNlUylafRCok0ALY48w/640?wxtype=jpeg&wxfrom=0]]></thumburl>\n    </appmsg>\n    <fromusername><![CDATA[wxid_2965349653612]]></fromusername>\n    <appinfo>\n        <version></version>\n        <appname><![CDATA[i黑马]]></appname>\n        <isforceupdate>1</isforceupdate>\n    </appinfo>\n    \n    \n    \n    \n    \n    \n</msg>',
//     timestamp: 1559707752,
//     toId: 'wxid_x01jgln69ath22',
//     type: 12,
//   }
//   const payload = await messageRawPayloadParser(MESSAGE_PAYLOAD)
//   t.deepEqual(payload, EXPECTED_PAYLOAD, 'should parse official account sent url.')
// })

// test('Transfer money message', async t => {
//   const MESSAGE_PAYLOAD = {
//     content: '<msg><appmsg appid="" sdkver=""><title><![CDATA[微信转账]]></title><des><![CDATA[收到转账0.10元。如需收钱，请点此升级至最新版本]]></des><action></action><type>2000</type><content><![CDATA[]]></content><url><![CDATA[https://support.weixin.qq.com/cgi-bin/mmsupport-bin/readtemplate?t=page/common_page__upgrade&text=text001&btn_text=btn_text_0]]></url><thumburl><![CDATA[https://support.weixin.qq.com/cgi-bin/mmsupport-bin/readtemplate?t=page/common_page__upgrade&text=text001&btn_text=btn_text_0]]></thumburl><lowurl></lowurl><extinfo></extinfo><wcpayinfo><paysubtype>1</paysubtype><feedesc><![CDATA[￥0.10]]></feedesc><transcationid><![CDATA[100005010119060500065311386661495024]]></transcationid><transferid><![CDATA[1000050101201906050603597352768]]></transferid><invalidtime><![CDATA[1559807491]]></invalidtime><begintransfertime><![CDATA[1559715691]]></begintransfertime><effectivedate><![CDATA[1]]></effectivedate><pay_memo><![CDATA[]]></pay_memo></wcpayinfo></appmsg></msg>',
//     data: null,
//     fromUser: 'lylezhuifeng',
//     messageId: '1006688402',
//     messageSource: '',
//     messageType: 49,
//     status: 3,
//     timestamp: 1559715691,
//     toUser: 'wxid_x01jgln69ath22',
//   }
//   const EXPECTED_PAYLOAD: MessagePayload = {
//     filename: '1006688402-to-be-implement.txt',
//     fromId: 'lylezhuifeng',
//     id: '1006688402',
//     mentionIdList: undefined,
//     roomId: undefined,
//     text: '<msg><appmsg appid="" sdkver=""><title><![CDATA[微信转账]]></title><des><![CDATA[收到转账0.10元。如需收钱，请点此升级至最新版本]]></des><action></action><type>2000</type><content><![CDATA[]]></content><url><![CDATA[https://support.weixin.qq.com/cgi-bin/mmsupport-bin/readtemplate?t=page/common_page__upgrade&text=text001&btn_text=btn_text_0]]></url><thumburl><![CDATA[https://support.weixin.qq.com/cgi-bin/mmsupport-bin/readtemplate?t=page/common_page__upgrade&text=text001&btn_text=btn_text_0]]></thumburl><lowurl></lowurl><extinfo></extinfo><wcpayinfo><paysubtype>1</paysubtype><feedesc><![CDATA[￥0.10]]></feedesc><transcationid><![CDATA[100005010119060500065311386661495024]]></transcationid><transferid><![CDATA[1000050101201906050603597352768]]></transferid><invalidtime><![CDATA[1559807491]]></invalidtime><begintransfertime><![CDATA[1559715691]]></begintransfertime><effectivedate><![CDATA[1]]></effectivedate><pay_memo><![CDATA[]]></pay_memo></wcpayinfo></appmsg></msg>',
//     timestamp: 1559715691,
//     toId: 'wxid_x01jgln69ath22',
//     type: 10,
//   }
//   const payload = await messageRawPayloadParser(MESSAGE_PAYLOAD)
//   t.deepEqual(payload, EXPECTED_PAYLOAD, 'should parse transfer money message.')
// })

// test('Transfer money confirm message', async t => {
//   const MESSAGE_PAYLOAD = {
//     content: '<msg>\n<appmsg appid="" sdkver="">\n<title><![CDATA[微信转账]]></title>\n<des><![CDATA[收到转账0.10元。如需收钱，请点此升级至最新版本]]></des>\n<action></action>\n<type>2000</type>\n<content><![CDATA[]]></content>\n<url><![CDATA[https://support.weixin.qq.com/cgi-bin/mmsupport-bin/readtemplate?t=page/common_page__upgrade&text=text001&btn_text=btn_text_0]]></url>\n<thumburl><![CDATA[https://support.weixin.qq.com/cgi-bin/mmsupport-bin/readtemplate?t=page/common_page__upgrade&text=text001&btn_text=btn_text_0]]></thumburl>\n<lowurl></lowurl>\n<extinfo>\n</extinfo>\n<wcpayinfo>\n<paysubtype>3</paysubtype>\n<feedesc><![CDATA[￥0.10]]></feedesc>\n<transcationid><![CDATA[100005010119060500065311386661495024]]></transcationid>\n<transferid><![CDATA[1000050101201906050603597352768]]></transferid>\n<invalidtime><![CDATA[1559802091]]></invalidtime>\n<begintransfertime><![CDATA[1559715691]]></begintransfertime>\n<effectivedate><![CDATA[1]]></effectivedate>\n<pay_memo><![CDATA[]]></pay_memo>\n\n\n</wcpayinfo>\n</appmsg>\n</msg>',
//     data: null,
//     fromUser: 'wxid_x01jgln69ath22',
//     messageId: '1601417905',
//     messageSource: '',
//     messageType: 49,
//     status: 3,
//     timestamp: 1559715714,
//     toUser: 'lylezhuifeng',
//   }
//   const EXPECTED_PAYLOAD: MessagePayload = {
//     filename: '1601417905-to-be-implement.txt',
//     fromId: 'wxid_x01jgln69ath22',
//     id: '1601417905',
//     mentionIdList: undefined,
//     roomId: undefined,
//     text: '<msg>\n<appmsg appid="" sdkver="">\n<title><![CDATA[微信转账]]></title>\n<des><![CDATA[收到转账0.10元。如需收钱，请点此升级至最新版本]]></des>\n<action></action>\n<type>2000</type>\n<content><![CDATA[]]></content>\n<url><![CDATA[https://support.weixin.qq.com/cgi-bin/mmsupport-bin/readtemplate?t=page/common_page__upgrade&text=text001&btn_text=btn_text_0]]></url>\n<thumburl><![CDATA[https://support.weixin.qq.com/cgi-bin/mmsupport-bin/readtemplate?t=page/common_page__upgrade&text=text001&btn_text=btn_text_0]]></thumburl>\n<lowurl></lowurl>\n<extinfo>\n</extinfo>\n<wcpayinfo>\n<paysubtype>3</paysubtype>\n<feedesc><![CDATA[￥0.10]]></feedesc>\n<transcationid><![CDATA[100005010119060500065311386661495024]]></transcationid>\n<transferid><![CDATA[1000050101201906050603597352768]]></transferid>\n<invalidtime><![CDATA[1559802091]]></invalidtime>\n<begintransfertime><![CDATA[1559715691]]></begintransfertime>\n<effectivedate><![CDATA[1]]></effectivedate>\n<pay_memo><![CDATA[]]></pay_memo>\n\n\n</wcpayinfo>\n</appmsg>\n</msg>',
//     timestamp: 1559715714,
//     toId: 'lylezhuifeng',
//     type: 10,
//   }
//   const payload = await messageRawPayloadParser(MESSAGE_PAYLOAD)
//   t.deepEqual(payload, EXPECTED_PAYLOAD, 'should parse transfer money confirm message.')
// })
