import { ioc } from '@untangled/core';
import { Configurations } from '@untangled/types';
import { SlackConnector } from '@/connectors/notify';

/**
 * Initializes the default {@link SlackConnector} instance.
 */
export async function createSlackClient(
  configs: Configurations
): Promise<SlackConnector> {
  const oauthToken = configs.slack.token;
  const defaultChannelId = configs.slack.channelId;
  return new (ioc.asBean<SlackConnector>(SlackConnector))(
    oauthToken,
    defaultChannelId
  );
}
