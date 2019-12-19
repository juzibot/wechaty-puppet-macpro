/* eslint no-unreachable: 0 */
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
import { CallbackType, GrpcRoomPayload } from '../schemas'
import { DebounceQueue, ThrottleQueue } from 'rx-queue'
import { Subscription } from 'rxjs'
import { isRoomId } from '../pure-function-helpers'
import { ScanStatus } from 'wechaty-puppet'

const PRE = 'GRPC_GATEWAY'

export type GrpcGatewayEvent = 'contact-list' | 'new-friend' | 'scan' | 'login' | 'message' | 'logout' | 'not-login' | 'room-list' | 'room-member' | 'room-create' | 'room-join' | 'room-qrcode' | 'reconnect' | 'invalid-token' | 'add-friend' | 'del-friend' | 'add-friend-before-accept' | 'heartbeat' | 'contact-info' | 'room-info'

export class GrpcGateway extends EventEmitter {

  private token: string
  private endpoint: string
  private client: MacproRequestClient
  private stream?: grpc.ClientReadableStream<ResponseObject>
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
    log.silly(PRE, `stop()`)

    if (this.stream) {
      this.stream.destroy()
      this.stream.removeAllListeners()
    }
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

    const result = await this._request(request)
    if (!result) {
      throw new Error(`can not get result by api name: ${apiName}`)
    }
    if (result.getToken() !== this.token) {
      throw new Error(`the token are different, be careful with the data`)
    }
    const resDataStr = result.getData()
    try {
      const resData = JSON.parse(resDataStr)
      log.silly(PRE, `
      ===============================================================
      API Name : ${apiName}
      Request data : ${JSON.stringify(data)}
      Response data : ${JSON.stringify(resData.code || resData)}
      ===============================================================
      `)
      if (JSON.stringify(resData.code) === '1') {
        return resData.data || resData
      } else {
        log.silly(PRE, `${apiName} request error data : ${util.inspect(resData)}`)
        if (resData.msg === '微信已掉线，不能操作') {
          log.silly(`Already logout, need to restart your bot.`)
        }
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
  public emit (event: 'del-friend', data: string): boolean
  public emit (event: 'contact-info', data: string): boolean
  public emit (event: 'room-info', data: string): boolean
  public emit (event: 'room-list', data: string): boolean
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
  public on (event: 'del-friend', listener: ((data: string) => any)): this
  public on (event: 'contact-info', listener: ((data: string) => any)): this
  public on (event: 'room-info', listener: ((data: string) => any)): this
  public on (event: 'room-list', listener: ((data: string) => any)): this
  public on (event: 'room-member', listener: ((data: string) => any)): this
  public on (event: 'room-create', listener: ((data: string) => any)): this
  public on (event: 'room-join', listener: ((data: string) => any)): this
  public on (event: 'room-qrcode', listener: ((data: string) => any)): this
  public on (event: 'scan', listener: ((data: string, status: ScanStatus) => any)): this
  public on (event: 'login', listener: ((data: string) => any)): this
  public on (event: 'message', listener: ((data: string) => any)): this
  public on (event: 'logout', listener: ((data: string) => any)): this
  public on (event: 'reconnect', listener: (() => any)): this
  public on (event: 'heartbeat', listener: (() => any)): this
  public on (event: never, listener: ((data: string) => any)): never

  public on (
    event: GrpcGatewayEvent,
    listener: ((data: string, status: ScanStatus) => any),
  ): this {
    log.verbose(PRE, `on(${event}, ${typeof listener}) registered`)
    super.on(event, (data: string, status: ScanStatus) => {
      try {
        listener.call(this, data, status)
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
      const channel = this.client.getChannel()
      if (channel) {
        await new Promise((resolve, reject) => {
          channel.getConnectivityState(true)
          const beforeState = channel.getConnectivityState(false)
          channel.watchConnectivityState(beforeState, Date.now() + 5000, (err) => {
            if (err) {
              reject(new Error('Try to connect to server timeout.'))
            } else {
              const state = channel.getConnectivityState(false)
              if (state !== grpc.connectivityState.READY) {
                reject(new Error(`Failed to connect to server, state changed to ${state}`))
              } else {
                resolve()
              }
            }
          })
        })
      } else {
        throw new Error('No channel for grpc client.')
      }

      const stream = this.client.notify(request)

      stream.on('error', async (err: any) => {
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
      stream.on('end', () => {
        log.error(PRE, 'grpc server end.')
      })
      stream.on('close', () => {
        log.error(PRE, 'grpc server close')
      })
      stream.on('data', async (data: MessageStream) => {
        log.silly(PRE, `event code :  ${data.getCode()}`)

        if (this.debounceQueue && this.throttleQueue) {
          this.debounceQueue.next(data)
          this.throttleQueue.next(data)
        }
        switch (data.getCode()) {
          case 'callback-send':
            const dataStr = data.getData()
            const _data = JSON.parse(dataStr)
            const type = _data.type
            switch (Number(type)) {
              case CallbackType.SendAddFriend:
                this.emit('add-friend-before-accept', data.getData())
                break
              case CallbackType.RoomList:
                this.emit('room-list', data.getData())
                break
              case CallbackType.ContactOrRoom:
                const contactOrRoomStr = data.getData()
                const contactOrRoom = JSON.parse(contactOrRoomStr)
                const roomInfo: GrpcRoomPayload = JSON.parse(contactOrRoom.msg)
                if (roomInfo && roomInfo.number && isRoomId(roomInfo.number)) {
                  this.emit('room-info', contactOrRoom.msg)
                } else {
                  this.emit('contact-info', contactOrRoom.msg)
                }
                break
              case CallbackType.ScanStatus:
                const scanStr = JSON.parse(data.getData())
                if (scanStr.status === 8) {
                  const data = {
                    status: ScanStatus.Confirmed,
                  }
                  this.emit('scan', JSON.stringify(data))
                }
                break
              default:
                log.warn(`Can not match any cases.`)
                break
            }
            break
          case 'invalid-token':
            macproToken()
            log.warn(`
            ===================================================
            This thread will been killed now.
            ===================================================
            `)
            process.exit(0)
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
          case 'del-friend':
            this.emit('del-friend', data.getData())
            break
          case 'heartbeat':
            if (this.debounceQueue && this.throttleQueue) {
              this.debounceQueue.next(data)
              this.throttleQueue.next(data)
            }
            break
          case 'server-heartbeat':
            log.silly(PRE, `Set server heartbeat time.`)
            break
          default:
            const code = data.getCode()
            log.silly(`the default code : ${code}`)
            log.error(PRE, `Can not get the notify`)
        }
      })
      this.stream = stream
    } catch (err) {
      await new Promise(resolve => setTimeout(resolve, 5000))
      log.silly(PRE, `${err}`)
      this.emit('reconnect')
    }
  }

}
