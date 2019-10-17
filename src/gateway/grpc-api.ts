import grpc from 'grpc'
import util from 'util'
import { log, macproToken } from '../config'

import { MacproRequestClient } from './proto-ts/Macpro_grpc_pb'

import {
  RequestObject,
  ResponseObject,
  MessageStream,
} from './proto-ts/Macpro_pb'
import { EventEmitter } from 'events'
import { CallbackType } from '../schemas'
import { DebounceQueue, ThrottleQueue } from 'rx-queue'
import { Subscription } from 'rxjs'

const PRE = 'GRPC_GATEWAY'

export type GrpcGatewayEvent = 'contact-list' | 'new-friend' | 'scan' | 'login' | 'message' | 'logout' | 'not-login' | 'room-member' | 'room-create' | 'room-join' | 'room-qrcode' | 'reconnect' | 'invalid-token' | 'add-friend' | 'add-friend-before-accept' | 'heartbeat'

export class GrpcGateway extends EventEmitter {

  private token: string
  private endpoint: string
  private client: MacproRequestClient

  private debounceQueue?: DebounceQueue
  private debounceQueueSubscription?: Subscription
  private throttleQueue?: ThrottleQueue
  private throttleQueueSubscription?: Subscription

  constructor (token: string, endpoint: string) {
    super()
    this.endpoint = endpoint
    this.token = token
    this.client = new MacproRequestClient(this.endpoint, grpc.credentials.createInsecure())

    this.debounceQueue = new DebounceQueue(30 * 1000)
    this.debounceQueueSubscription = this.debounceQueue.subscribe(async () => {
      try {
        await this.keepHeartbeat()
      } catch (e) {
        log.silly(PRE, `debounce error : ${util.inspect(e)}`)
      }
    })

    this.throttleQueue = new ThrottleQueue(30 * 1000)
    this.throttleQueueSubscription = this.throttleQueue.subscribe(() => {
      log.silly(PRE, `throttleQueue emit heartbeat.`)
      this.emit('heartbeat')
    })
  }

  private async keepHeartbeat () {
    log.silly(PRE, `keepHeartbeat()`)

    try {
      const res = await this.request('heartbeat')
      if (!res) {
        throw new Error(`no heartbeat response from grpc server`)
      }
    } catch (error) {
      log.error(`can not get heartbeat from grpc server`)
      this.emit('reconnect')
    }
  }

  public async stop () {
    this.client.close()

    if (!this.throttleQueueSubscription || !this.debounceQueueSubscription) {
      log.verbose(PRE, `releaseQueue() subscriptions have been released.`)
    } else {
      this.throttleQueueSubscription.unsubscribe()
      this.debounceQueueSubscription.unsubscribe()

      this.throttleQueueSubscription = undefined
      this.debounceQueueSubscription = undefined
    }

    if (!this.debounceQueue || !this.throttleQueue) {
      log.verbose(PRE, `releaseQueue() queues have been released.`)
    } else {
      this.debounceQueue.unsubscribe()
      this.throttleQueue.unsubscribe()

      this.debounceQueue = undefined
      this.throttleQueue = undefined
    }
  }

  public async request (apiName: string, data?: any): Promise<any> {
    const request = new RequestObject()
    request.setToken(this.token)
    request.setApiname(apiName)

    if (data) {
      request.setData(JSON.stringify(data))
    }

    try {
      const result = await this._request(request)
      const resData = JSON.parse(result.getData())
      log.silly(PRE, `
      ===============================================================
      API Name : ${apiName}
      Request data : ${JSON.stringify(data)}
      Response data : ${JSON.stringify(resData.code || resData)}
      ===============================================================
      `)
      if (result.getToken() !== this.token) {
        throw new Error(`the token are different, be careful with the data`)
      }
      if (JSON.stringify(resData.code) === '1') {
        return resData.data || resData
      } else {
        log.silly(PRE, `${apiName} request error data : ${util.inspect(resData)}`)
      }
    } catch (err) {
      log.silly(PRE, `${apiName} request error`)
      if (err.details === 'INVALID_TOKEN') {
        macproToken()
      }
      throw new Error(`Can not get data from Transmit Server`)
    }
  }

  private async _request (request: RequestObject): Promise<ResponseObject> {
    return new Promise<ResponseObject>((resolve, reject) => {
      this.client.request(
        request,
        (err: Error | null, response: ResponseObject) => {
          if (err !== null) {
            reject(err)
          } else {
            resolve(response)
          }
        }
      )
    })
  }

  public emit (event: 'add-friend-before-accept', data: string): boolean
  public emit (event: 'invalid-token', data: string): boolean
  public emit (event: 'not-login', data: string): boolean
  public emit (event: 'contact-list', data: string): boolean
  public emit (event: 'new-friend', data: string): boolean
  public emit (event: 'add-friend', data: string): boolean
  public emit (event: 'room-member', data: string): boolean
  public emit (event: 'room-create', data: string): boolean
  public emit (event: 'room-join', data: string): boolean
  public emit (event: 'room-qrcode', data: string): boolean
  public emit (event: 'scan', data: string): boolean
  public emit (event: 'login', data: string): boolean
  public emit (event: 'message', data: string): boolean
  public emit (event: 'logout', data: string): boolean
  public emit (event: 'reconnect'): boolean
  public emit (event: 'heartbeat'): boolean
  public emit (event: never, data: string): never

  public emit (
    event: GrpcGatewayEvent,
    data?: string,
  ): boolean {
    return super.emit(event, data)
  }

  public on (event: 'add-friend-before-accept', listener: ((data: string) => any)): this
  public on (event: 'not-login', listener: ((data: string) => any)): this
  public on (event: 'contact-list', listener: ((data: string) => any)): this
  public on (event: 'new-friend', listener: ((data: string) => any)): this
  public on (event: 'add-friend', listener: ((data: string) => any)): this
  public on (event: 'room-member', listener: ((data: string) => any)): this
  public on (event: 'room-create', listener: ((data: string) => any)): this
  public on (event: 'room-join', listener: ((data: string) => any)): this
  public on (event: 'room-qrcode', listener: ((data: string) => any)): this
  public on (event: 'scan', listener: ((data: string) => any)): this
  public on (event: 'login', listener: ((data: string) => any)): this
  public on (event: 'message', listener: ((data: string) => any)): this
  public on (event: 'logout', listener: ((data: string) => any)): this
  public on (event: 'reconnect', listener: (() => any)): this
  public on (event: 'heartbeat', listener: (() => any)): this
  public on (event: never, listener: ((data: string) => any)): never

  public on (
    event: GrpcGatewayEvent,
    listener: ((data: string) => any),
  ): this {
    log.verbose(PRE, `on(${event}, ${typeof listener}) registered`)
    super.on(event, (data: string) => {
      try {
        listener.call(this, data)
      } catch (e) {
        log.error(PRE, `onFunction(${event}) listener exception: ${e}`)
      }
    })
    return this
  }

  public async notify (apiName: string, data?: any) {
    log.silly(PRE, `notify(${apiName}, ${data})`)
    const request = new RequestObject()
    request.setToken(this.token)
    request.setApiname(apiName)

    if (data) {
      request.setData(JSON.stringify(data))
    }

    try {
      const result = this.client.notify(request)

      result.on('error', async (err: any) => {
        log.error(PRE, `GRPC SERVER ERROR.
        =====================================================================
        try to reconnect grpc server, waiting...
        =====================================================================
        `)
        if (err.code === 14 || err.code === 13 || err.code === 2) {
          await new Promise(resolve => setTimeout(resolve, 5000))
          this.emit('reconnect')
        } else {
          log.error(PRE, `stream error:`, util.inspect(err))
        }
      })
      result.on('end', () => {
        log.error(PRE, 'grpc server end.')
      })
      result.on('close', () => {
        log.error(PRE, 'grpc server close')
      })
      result.on('data', (data: MessageStream) => {
        log.silly(PRE, `event code :  ${data.getCode()}`)

        if (this.debounceQueue && this.throttleQueue) {
          this.debounceQueue.next(data)
          this.throttleQueue.next(data)
        }
        switch (data.getCode()) {
          case 'callback-send':
            const dataStr = data.getData()
            const type = JSON.parse(dataStr).type
            if (type === CallbackType.SendAddFriend) {
              this.emit('add-friend-before-accept', data.getData())
            }
            break
          case 'invalid-token':
            macproToken()
            break
          case 'not-login':
            this.emit('not-login', data.getData())
            break
          case 'contact-list' :
            this.emit('contact-list', data.getData())
            break
          case 'room-member' :
            this.emit('room-member', data.getData())
            break
          case 'room-create' :
            this.emit('room-create', data.getData())
            break
          case 'room-join' :
            this.emit('room-join', data.getData())
            break
          case 'room-qrcode' :
            this.emit('room-qrcode', data.getData())
            break
          case 'scan' :
            this.emit('scan', data.getData())
            break
          case 'login' :
            this.emit('login', data.getData())
            break
          case 'message' :
            this.emit('message', data.getData())
            break
          case 'logout' :
            this.emit('logout', data.getData())
            break
          case 'add-friend':
            this.emit('add-friend', data.getData())
            break
          case 'new-friend':
            this.emit('new-friend', data.getData())
            break
          case 'heartbeat':
            if (this.debounceQueue && this.throttleQueue) {
              this.debounceQueue.next(data)
              this.throttleQueue.next(data)
            }
            break
          default:
            log.error(PRE, `Can not get the notify`)
            throw new Error(`can not get the notify`)
        }
      })
    } catch (err) {
      log.silly(PRE, `error : ${err}`)
      this.emit('reconnect')
    }
  }

}
