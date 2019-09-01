# WECHATY-PUPPET-MACPRO

## Puppet-Macpro安装流程

1. 初始化测试项目

```js
mkdir testPuppetMacpro

npm init
```

2. 安装wechaty最新版

```js
npm install wechaty@next
```

3. 安装wechaty-puppet-macpro

```js
npm install wechaty-puppet-macpro
```

4. 安装其他依赖环境，例如在终端显示二维码的包

```js
npm install qrcode-terminal
```

## 示例代码(typescript版本)
```js
import {
  Wechaty,
} from 'wechaty';
import {
  PuppetMacpro
} from 'wechaty-puppet-macpro';
import QrcodeTerminal from 'qrcode-terminal';

const token = '你的token';

const puppet: any = new PuppetMacpro({
  token,
})

const bot = new Wechaty({
  puppet,
});

bot
  .on('scan', (qrcode) => {
    QrcodeTerminal.generate(qrcode, {
      small: true
    });
  })
  .on('message', async msg => {
    console.log(`msg : ${msg}`)
  })
  .start()
```
