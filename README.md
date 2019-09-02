# WECHATY-PUPPET-MACPRO

## Install

### 1. Init

```js
mkdir testPuppetMacpro

npm init
```

### 2. Install the latest wechaty

```js
npm install wechaty
```

### 3. Install wechaty-puppet-macpro

> Notice: wechaty-puppet-macpro still in alpha test period, so we keep updating the package, you should install the latest packge by using `@next` until we release the stable package.

```js
npm install wechaty-puppet-macpro@next
```

### 4. Install other dependency

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
import { generate } from 'qrcode-terminal';

const token = 'your token';

const puppet = new PuppetMacpro({
  token,
})

const bot = new Wechaty({
  puppet,
});

bot
  .on('scan', (qrcode) => {
    generate(qrcode, {
      small: true
    });
  })
  .on('message', msg => {
    console.log(`msg : ${msg}`)
  })
  .start()
```
