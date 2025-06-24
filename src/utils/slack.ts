import { KnownBlock } from '@slack/web-api';
import { beanOf } from '@untangled/core/ioc';
import { SlackConnector } from '@/connectors/notify';

/**
 * Returns a {@link Date} in the format like `Nov 13 2023 19:23 UTC`.
 * @param date the {@link Date}.
 */
function prettyDate(date: Date) {
  return date
    .toLocaleString('en-US', {
      month: 'short',
      day: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone: 'UTC',
    })
    .replace(',', '')
    .concat(' (UTC)');
}

type MessageOptions = {
  /**
   * Channel Id.
   */
  channel?: string;
  /**
   * Thread Id.
   */
  thread?: string;
  /**
   * URL for the title's icon (in a Context block).
   */
  icon?: string;
  /**
   * Title (in a Context block).
   */
  title: string;
  /**
   * Header (in a Section block).
   */
  header?: string;
  /**
   * Description (in a Section block).
   */
  description?: string | string[];
};

/**
 * Generates Slack message blocks.
 */
export function messageBlocks(options: MessageOptions) {
  const now = new Date();
  const { title, icon, header, description } = options;
  const blocks = [
    title && {
      type: 'context',
      elements: [
        icon && {
          type: 'image',
          image_url: icon,
          alt_text: title,
        },
        {
          type: 'mrkdwn',
          text: title,
        },
      ].filter((e) => !!e),
    },
    header && {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: header,
      },
    },
    description && {
      type: 'section',
      fields: [description].flat().map((d) => ({
        type: 'mrkdwn',
        text: d,
      })),
    },
    {
      type: 'context',
      elements: [
        {
          type: 'mrkdwn',
          text: `<!date^${Math.ceil(now.getTime() / 1e3)}^{date_short_pretty} {time}|${prettyDate(now)}>`,
        },
      ],
    },
  ] as KnownBlock[];
  return blocks.filter((block) => !!block);
}

/**
 * Returns basic information of the application.
 */
function appInfo() {
  const appName =
    '*<https://github.com/untangledfinance/untangled-tunnel|untangled-tunnel>*';
  const systemName = 'Tunnel';
  const tunnelLink = 'ssh://ssh.untangled.finance';
  return {
    appName,
    systemName,
    tunnelLink,
  };
}

/**
 * Uses Slack for notifications.
 * @see SlackConnector
 */
export function useSlack() {
  const client = beanOf(SlackConnector);
  const { appName, systemName, tunnelLink } = appInfo();
  return {
    /**
     * The default {@link SlackConnector} instance.
     */
    client,
    /**
     * To create notification structure following Slack formats.
     */
    builder: {
      /**
       * Data to be sent when a user's authorized key is added for tunneling.
       */
      authorizedKeyAdded: (
        user = systemName,
        options: {
          /**
           * The username.
           */
          username: string;
        }
      ) =>
        messageBlocks({
          title: `*${user}* added an authorized key for *${options.username}* via ${appName}.`,
        }),
      /**
       * Data to be sent when a user has granted access to a specific address.
       */
      accessGranted: (
        user = systemName,
        options: {
          /**
           * The username.
           */
          username: string;
          /**
           * The address alias.
           */
          accesses: string[];
        }
      ) => {
        const access = options.accesses
          .map((access) => `<${tunnelLink}|${access}>`)
          .join(', ');
        return messageBlocks({
          title: `*${user}* allowed *${options.username}* to access ${access} via ${appName}.`,
        });
      },
      accessRevoked: (
        user = systemName,
        options: {
          /**
           * The username.
           */
          username: string;
          /**
           * The address alias.
           */
          accesses: string[];
        }
      ) => {
        const access = options.accesses
          .map((access) => `<${tunnelLink}|${access}>`)
          .join(', ');
        return messageBlocks({
          title: `*${user}* removed *${options.username}*'s access to ${access} via ${appName}.`,
        });
      },
    },
  };
}

/**
 * Pushes a message via Slack and mentions specific members if needed.
 */
export async function notify(
  options: Omit<MessageOptions, 'threadId'>,
  ...mentions: string[]
) {
  const { client } = useSlack();
  const send = async (
    blocks: KnownBlock[],
    channelId?: string,
    threadId?: string
  ): Promise<{
    ok: boolean;
    threadId?: string;
  }> => {
    return client.send(blocks, channelId, threadId);
  };
  const { ok, threadId } = await send(
    messageBlocks({
      icon: options.icon,
      title: options.title,
      header: options.header,
      description: mentions.length ? '' : options.description,
    }),
    options.channel,
    options.thread
  );
  if (ok && mentions.length) {
    return (
      await send(
        messageBlocks({
          title: '',
          header: mentions.join(' '),
          description: options.description,
        }),
        options.channel,
        threadId
      )
    ).ok;
  }
  return ok;
}
