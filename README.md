# WECHATY-PUPPET-MACPRO

## Install

1. Init

   ```js
   mkdir testPuppetMacpro

   npm init
   ```

1. Install the latest wechaty

   ```js
   npm install wechaty
   ```

1. Install wechaty-puppet-macpro

   ```js
   npm install wechaty-puppet-macpro@next
   ```

1. Install other dependency

   ```js
   npm install qrcode-terminal
   ```

## Example

```js
import {
  Wechaty,
} from 'wechaty';
import {
  PuppetMacpro
} from 'wechaty-puppet-macpro';
import QrcodeTerminal from 'qrcode-terminal';

const token = 'your token';

const puppet = new PuppetMacpro({
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
  .on('message', msg => {
    console.log(`msg : ${msg}`)
  })
  .start()
```
