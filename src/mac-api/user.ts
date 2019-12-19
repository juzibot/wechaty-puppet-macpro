import { RequestClient } from '../utils/request'
import { RequestStatus } from '../schemas'
import { log } from '../config'

const PRE = 'MAC_API_USER'

export default class MacproUser {

  private requestClient: RequestClient
  private token: string

  constructor (token: string, requestClient: RequestClient) {
    this.token = token
    this.requestClient = requestClient
  }

  public heartbeat = async () => {
    log.silly(PRE, `heartbeat()`)

    await this.requestClient.request({
      apiName: 'heartbeat',
    })
  }

  // 获取微信登录二维码
  public getWeChatQRCode = async (userName?: string) => {
    log.silly(PRE, `getWeChatQRCode(${userName || 'first login'})`)
    let data = {
      extend: this.token,
    }
    if (userName) {
      Object.assign(data, { account: userName })
    }
    const res = await this.requestClient.request({
      apiName: 'loginScanQRCode',
      data,
    })
    log.silly(PRE, `res : ${JSON.stringify(res)}`)
    if (res.task_id) {
      log.silly(PRE, `ready for scanning qrcode for login.`)
    } else {
      throw new Error(`can not get qrcode from grpc server`)
    }
  }

  // 登出微信
  public logoutWeChat = async (account: string): Promise<void> => {
    log.silly(PRE, `logoutWeChat(${account})`)

    const data = {
      my_account: account,
    }

    await this.requestClient.request({
      apiName: 'logoutWeixin',
      data,
    })
  }

  // 添加好友
  public addFriend = async (
    loginedId: string,
    account: string,
    content: string,
  ): Promise<RequestStatus> => {
    log.silly(PRE, `addFriend(${loginedId}, ${account}, ${content})`)

    const data = {
      account: account,
      content: content,
      extend: loginedId,
      my_account: loginedId,
    }

    const res = await this.requestClient.request({
      apiName: 'addFriend',
      data,
    })
    log.silly(PRE, `res : ${JSON.stringify(res)}`)
    if (res.code === RequestStatus.Success) {
      return RequestStatus.Success
    } else {
      return RequestStatus.Fail
    }
  }

  // 删除好友
  public delFriend = async (loginedId: string, account: string): Promise<RequestStatus> => {
    log.silly(PRE, `delFriend(${loginedId}, ${account})`)

    const data = {
      my_account: loginedId,
      to_account: account,
    }

    const res = await this.requestClient.request({
      apiName: 'delFriend',
      data,
    })
    log.silly(PRE, `res : ${JSON.stringify(res)}`)
    if (res.code === RequestStatus.Success) {
      return RequestStatus.Success
    } else {
      return RequestStatus.Fail
    }
  }

  // 自动通过好友
  public acceptFriend = async (loginedId: string, account: string): Promise<RequestStatus> => {
    log.silly(PRE, `acceptFriend(${loginedId}, ${account})`)

    const data = {
      account,
      my_account: loginedId,
    }

    const res = await this.requestClient.request({
      apiName: 'acceptFriend',
      data,
    })
    log.silly(PRE, `res : ${JSON.stringify(res)}`)
    if (res.code === RequestStatus.Success) {
      return RequestStatus.Success
    } else {
      return RequestStatus.Fail
    }
  }

}
