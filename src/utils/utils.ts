import { log } from '../config'

const crypto = require('crypto')

export default class Util {

  public static randomStr (n: number) {
    const num = n || 16
    var str = 'abcdefghijklmnopqrstuvwxyz0123456789'
    var result = ''
    for (var i = 0; i < num; i++) {
      result += str[parseInt((Math.random() * str.length).toString())]
    }
    return result
  }

  public static createHSWebTime () {
    const timestamp = new Date().getTime() // Date.now()
    const uniqueStr = this.randomStr(23)
    return timestamp + uniqueStr
  }

  public static createToken (hswebtime: string) {
    const key = '19a5806daef58af5be452eb17b56a3ac11a65fad93dd9aeaf71f4c73e3f910aa'
    const data = hswebtime + key
    const md5 = crypto.createHash('md5').update(data, 'utf8').digest('hex')
    return md5
  }

  public static macproToken = () => {
    const token = process.env.WECHATY_PUPPET_MACPRO_TOKEN as string
    if (!token) {
      log.error('PuppetMacproConfig', `

        WECHATY_PUPPET_MACPRO_TOKEN environment variable not found.

        PuppetPadpro need a token before it can be used,
        Please set WECHATY_PUPPET_MACPRO_TOKEN then retry again.

      `)
      throw new Error('You need a valid WECHATY_PUPPET_MACPRO_TOKEN to use PuppetMacpro')
    }
    return token
  }

}
