import { log }      from 'brolog'
import { FileBox }  from 'file-box'
import qrImage      from 'qr-image'
import { OperationOptions } from 'retry'
import promiseRetry = require('promise-retry')
export const CHATIE_OFFICIAL_ACCOUNT_QRCODE = 'http://weixin.qq.com/r/qymXj7DEO_1ErfTs93y5'

export const macproToken = () => {
  const token = process.env.WECHATY_PUPPET_MACPRO_TOKEN as string
  if (!token) {
    log.error('PuppetMacproConfig', `

      WECHATY_PUPPET_MACPRO_TOKEN environment variable not found.

      PuppetMacpro need a token before it can be used,
      Please set WECHATY_PUPPET_MACPRO_TOKEN then retry again.

    `)
    throw new Error('You need a valid WECHATY_PUPPET_MACPRO_TOKEN to use PuppetMacpro')
  }
  return token
}

/**
 * GRPC server
 */
export const GRPC_ENDPOINT = '52.82.124.54:3333'

export const MESSAGE_CACHE_AGE = 1000 * 60 * 60
export const MESSAGE_CACHE_MAX = 1000

export const AWS_S3 = {
  ACCESS_KEY_ID: 'AKIA3PQY2OQG5FEXWMH6',
  BUCKET: 'macpro-message-file',
  EXPIRE_TIME: 3600 * 24 * 3,
  PATH: 'image-message/',
  SECRET_ACCESS_KEY: 'jw7Deo+W8l4FTOL2BXd/VubTJjt1mhm55sRhnsEn',
}

export function qrCodeForChatie (): FileBox {
  const name                           = 'qrcode-for-chatie.png'
  const type                           = 'png'

  const qrStream = qrImage.image(CHATIE_OFFICIAL_ACCOUNT_QRCODE, { type })
  return FileBox.fromStream(qrStream, name)
}

export { VERSION } from './version'

export {
  log,
}

export async function retry<T> (
  retryableFn: (
    retry: (error: Error) => never,
    attempt: number,
    ) => Promise<T>,
  num?: number,
): Promise<T> {
  /**
   * 60 seconds: (to be confirmed)
   *  factor: 3
   *  minTimeout: 10
   *  maxTimeout: 20 * 1000
   *  retries: 9
   */
  const factor     = 3
  const minTimeout = 10
  const maxTimeout = (num || 20) * 1000
  const retries    = 9
  // const unref      = true

  const retryOptions: OperationOptions = {
    factor,
    maxTimeout,
    minTimeout,
    retries,
  }
  return promiseRetry(retryOptions, retryableFn)
}
