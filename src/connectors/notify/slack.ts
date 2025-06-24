import { ErrorCode, KnownBlock, WebClient } from '@slack/web-api';
import { createLogger } from '@untangled/core/logging';
import { NotifyConnector } from '@untangled/core/notify';
import { isString } from '@untangled/core/types';

const logger = createLogger('Slack');

/**
 * Slack Notification Connector.
 */
export class SlackConnector extends NotifyConnector<KnownBlock[], string> {
  private readonly client: WebClient;
  private readonly defaultChannelId: string;

  constructor(oauthToken: string, defaultChannelId?: string) {
    super();
    this.client = new WebClient(oauthToken);
    this.defaultChannelId = defaultChannelId;
  }

  override async send(
    data: KnownBlock[] | string,
    channelId?: string,
    threadId?: string
  ) {
    try {
      const channel = channelId ?? this.defaultChannelId;
      const { ok, message, ts } = await this.client.chat.postMessage({
        text: isString(data) && data,
        blocks: !isString(data) && data,
        channel,
        thread_ts: threadId,
      });
      return {
        ok,
        message,
        threadId: ts,
      };
    } catch (err) {
      if (err.code === ErrorCode.PlatformError) {
        return err.data as {
          ok: boolean;
          error: string;
        };
      } else {
        logger.error(`${err.message}\n`, err);
      }
      return {
        ok: false,
      };
    }
  }
}
