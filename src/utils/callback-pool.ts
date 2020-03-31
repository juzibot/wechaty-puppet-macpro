export default class CallbackPool {
  public static poolMap: { [requestId: string]: (data: any) => void } = {}

  public static pushCallbackToPool (requestId: string, callback: (data: any) => void) {
    this.poolMap[requestId] = callback
  }

  public static getCallback (requestId: string) {
    return this.poolMap[requestId]
  }

  public static removeCallback (requestId: string) {
    delete this.poolMap[requestId]
  }
}