import { UrlLinkPayload } from 'wechaty-puppet'

import { log } from '../config'
import { MacproMessagePayload, MacproMessageType } from '../schemas'

interface UrlRawPayload {
  title: string,
  thumbUrl: string,
  des: string,
  url: string,
}

export function messageUrlPayloadParser (
  message: MacproMessagePayload,
): UrlLinkPayload | null {
  if (message.content_type !== MacproMessageType.UrlLink) {
    return null
  }
  try {
    const urlData: UrlRawPayload = JSON.parse(message.content)

    const result: UrlLinkPayload = {
      description: urlData.des,
      thumbnailUrl: urlData.thumbUrl,
      title: urlData.title,
      url: urlData.url,
    }
    return result
  } catch (e) {
    log.verbose(`Can not parse url link message.\nmessage: ${JSON.stringify(message)}\nerror: ${e.stack}`)
    return null
  }
}
