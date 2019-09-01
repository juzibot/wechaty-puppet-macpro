import test from 'blue-tape'
import { MacproMessagePayload } from '../schemas'
import { messageUrlPayloadParser } from './message-url-payload-parser'

test('messageRawPayloadParser', async t => {
  t.test('url message should be parsed correctly', async t => {
    const messagePayload: MacproMessagePayload = {
      content: '{"title":"华为方舟编译器正式开源，采用自主平台托管","thumbUrl":"https:\\/\\/mmbiz.qlogo.cn\\/mmbiz_jpg\\/dkwuWwLoRK8c0FV4Lt4zmdXHn4yaB2XoEa2tGmz3ia8kWdTe5RwWLHQmB3uNgibvoUT5x6AAvDmUudGvcxX2E5uw\\/300?wx_fmt=jpeg&wxfrom=1","des":"这一次真的ShowYouTheCode！","url":"http:\\/\\/mp.weixin.qq.com\\/s?__biz=MjM5NzM0MjcyMQ==&mid=2650089862&idx=1&sn=6ab5785677f182b661dfeca47595c57e&chksm=bedaf2e889ad7bfe272834e36a2633f626c08c386cf788df689044685c71f86c6a04384998f5&mpshare=1&scene=1&srcid=0831jGSwzszYoePZTbzN4tMW&sharer_sharetime=1567263242173&sharer_shareid=5c503c426d3ab6da3fb58c9ab1e8d7a8#rd"}',
      content_type: 8,
      file_name: '',
      messageId: '1',
      my_account: 'wxid_v7j3e9kna9l912',
      my_account_alias: 'wxid_v7j3e9kna9l912',
      my_name: '李青青',
      timestamp: 0,
      to_account: 'lylezhuifeng',
      to_name: '高原ོ',
      type: 2,
      voice_len: '',
    }

    const EXPECTED_RESULT = {
      description: '这一次真的ShowYouTheCode！',
      thumbnailUrl: 'https://mmbiz.qlogo.cn/mmbiz_jpg/dkwuWwLoRK8c0FV4Lt4zmdXHn4yaB2XoEa2tGmz3ia8kWdTe5RwWLHQmB3uNgibvoUT5x6AAvDmUudGvcxX2E5uw/300?wx_fmt=jpeg&wxfrom=1',
      title: '华为方舟编译器正式开源，采用自主平台托管',
      url: 'http://mp.weixin.qq.com/s?__biz=MjM5NzM0MjcyMQ==&mid=2650089862&idx=1&sn=6ab5785677f182b661dfeca47595c57e&chksm=bedaf2e889ad7bfe272834e36a2633f626c08c386cf788df689044685c71f86c6a04384998f5&mpshare=1&scene=1&srcid=0831jGSwzszYoePZTbzN4tMW&sharer_sharetime=1567263242173&sharer_shareid=5c503c426d3ab6da3fb58c9ab1e8d7a8#rd',
    }
    const actual = messageUrlPayloadParser(messagePayload)
    t.deepEqual(actual, EXPECTED_RESULT)
  })
})
