# WECHATY-PUPPET-MACPRO

## Notice

1. wechaty-puppet-macpro is still in Early Alpha Stage, please make sure you have the necessary engineering technics to deal with the bugs instead of just asking for support.
2. You are welcome to file an issue to reproduce the problem, if it is reproducible, we will fix that as soon as possible.
3. If you need a stable version, please keep waiting until we release the stable one.

## Install

### 1. Init

#### 1.1. Check your `Node` version first

```js
node --version // v10.16.0 (BTW v10.0.0 < version < v11.0.0 is better)
```

> for windows system

To make sure you could install `wechaty-puppet-macpro` successfully, you have to start PowerShell as Administrator and run these commands:

```js
npm install -g windows-build-tools

npm install -g node-gyp
```

#### 1.2. Create your bot folder and do some init config

```js
mkdir my-macpro-bot && cd my-macpro-bot

npm init -y

npm install ts-node typescript -g

tsc --init
```

### 2. Install the bot dependency

```js
npm install wechaty@latest

npm install wechaty-puppet-macpro@latest
```

Or some new features developing version:

```js
npm install wechaty@next

npm install wechaty-puppet-macpro@next
```

### 3. Install other dependency

> There's no need to install `wechaty-puppet` in my-macpro-bot

```js
npm install qrcode-terminal
...
```

### 4. Other Tips

> If step 1~3 can not help you install successfully, please try this suggestion, otherwise just skip it please.

```js
rm -rf node_modules package-lock.json
npm install
```

> If you want to see detail logs about your bot, just run:

```js
BROLOG_LEVEL=silly ts-node index.ts
```

or

```js
BROLOG_LEVEL=silly node index.js
```

## Example

```js
import { Wechaty      } from 'wechaty'
import { PuppetMacpro } from 'wechaty-puppet-macpro'
import { generate     } from 'qrcode-terminal'

const token = 'your token'
const name  = 'your-bot-name'

const puppet = new PuppetMacpro({
  token,
})

const bot = new Wechaty({
  puppet,
  name, // login without scan qrcode at next time, it will generate xxxx.memory-card.json and save login data.
})

bot
  .on('scan', (qrcode) => {
    generate(qrcode, {
      small: true
    })
  })
  .on('login', (user) => {
    console.log(`login user : ${user}`)
  })
  .on('message', msg => {
    console.log(`msg : ${msg}`)
  })
  .start()
```

## Puppet Comparison

功能 | padpro | macpro | macpro
---|---|---|---
 **<消息>**|||
 收发文本|✅|✅|✅
 收发个人名片|✅|✅|✅
 收发图文链接|✅|✅|✅
 发送图片、文件|✅|✅|✅（对内容有大小限制，20M以下）
 接收图片、文件|✅|✅|✅（对内容有大小限制，25M以下）
 发送视频|✅|✅|✅（视频以链接形式发送）
 接收视频|✅|✅|✅
 发送小程序|❌|✅|❌
 接收动图|❌|✅|✅
 发送动图|❌|✅|✅
 接收语音消息|✅|✅|✅
 发送语音消息|✅|❌|❌
 转发文本|✅|✅|✅
 转发图片|✅|✅|✅
 转发图文链接|✅|✅|✅
 转发音频|✅|✅|❌
 转发视频|✅|✅|✅
 转发文件|✅|✅|✅
 转发动图|❌|❌|❌
 转发小程序|❌|❌|❌
 **<群组>**|||
 创建群聊|✅|✅|✅
 设置群公告|✅|✅|✅
 获取群公告|❌|❌|✅
 群二维码|✅|✅|✅
 拉人进群|✅|✅|✅
 踢人出群|✅|✅|✅
 退出群聊|✅|✅|✅
 改群名称|✅|✅|✅
 入群事件|✅|✅|✅
 离群事件|✅|✅|✅
 群名称变更事件|✅|✅|✅
 @群成员|✅|✅|✅
 群列表|✅|✅|✅
 群成员列表|✅|✅|✅
 群详情|✅|✅|✅
 **<联系人>**|||
 修改备注|✅|✅|✅
 添加好友|✅|✅|✅
 自动通过好友|✅|✅|✅
 添加好友|✅|✅|✅
 好友列表|✅|✅|✅
 好友详情|✅|✅|✅
 **<其他>**|||
 登录微信|✅|✅|✅
 扫码状态|✅|❌|✅
 退出微信|✅|✅|✅
 依赖协议|iPad|Mac|iPad|
