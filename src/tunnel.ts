import crypto from 'crypto';
import { Mongo } from '@untangled/connectors/mongo';
import { Server, ServerConfigurations } from '@untangled/core/tunneling/ssh';
import { NullableType } from '@untangled/core/types';
import { TunnelService } from '@/services';

/**
 * Tunneling configurations.
 */
export type TunnelConfigs = {
  tunnel: {
    /**
     * Connected MongoDB configurations.
     */
    database: {
      /**
       * Database's name.
       */
      name: string;
      /**
       * Connection host.
       */
      host: string;
      /**
       * Connection port.
       */
      port: number;
      /**
       * Username.
       */
      username: string;
      /**
       * Password.
       */
      password: string;
      /**
       * To specify using TLS or not.
       */
      tls: boolean;
    };
    /**
     * SSH tunneling configurations.
     */
    ssh: {
      /**
       * Path to the SSH server's host key file.
       */
      hostKeyPath: string;
      /**
       * Port of the SSH server.
       */
      port: number;
    };
  };
};

/**
 * SSH {@link Server} that can be created as a {@link Bean}.
 */
export const SSHServer = Bean(Server, 'SSHServer');

/**
 * A {@link Mongo} database used only for tunneling configurations.
 */
@Singleton
class TunnelMongo extends Mongo {}

/**
 * Returns a {@link Mongo} instance for tunneling if enabled.
 */
export function tunnelDatabase(): NullableType<Mongo> {
  const { tunnel } = (Configs.env as TunnelConfigs) ?? {};
  const { database: dbConfigs } = tunnel ?? {};
  const db =
    dbConfigs &&
    new TunnelMongo({
      database: dbConfigs.name,
      host: dbConfigs.host,
      port: dbConfigs.port,
      username: dbConfigs.username,
      password: dbConfigs.password,
      tls: dbConfigs.tls,
    });
  return db;
}

/**
 * Creates an SSH {@link Server} that supports remote port forwarding.
 */
export async function startTunnel({ tunnel: configs }: TunnelConfigs) {
  const db = tunnelDatabase();
  db && (await db.onInit());
  const { hostKeyPath, port } = configs?.ssh ?? {};
  const server = new SSHServer({
    port,
    hostKeyPath,
    authenticate: async (ctx) => {
      if (ctx.method !== 'publickey') {
        return false;
      }
      const { authorizedKeys } =
        (await TunnelService.findOneByUsername(ctx.username, db)) ?? {};
      for (const authorizedKey of authorizedKeys ?? []) {
        const { publicKey, type } = Server.parsePublicKey(
          Buffer.from(authorizedKey)
        );
        const authorized =
          ctx.key.algo === type &&
          crypto.timingSafeEqual(ctx.key.data, publicKey);
        if (authorized) return true;
      }
      return false;
    },
    validateBind: async (ctx, host, port) => {
      const { binds } =
        (await TunnelService.findOneByUsername(ctx.username, db)) ?? {};
      for (const bind of binds ?? []) {
        if (bind.host === host && bind.port === port) {
          return true;
        }
      }
      return false;
    },
    validateAccess: async (ctx, host, port) => {
      const { accesses } =
        (await TunnelService.findOneByUsername(ctx.username, db)) ?? {};
      for (const access of accesses ?? []) {
        if (access.host === host && access.port === port) {
          return true;
        }
      }
      return false;
    },
    translateHost: async (ctx, host) => {
      const { accesses } =
        (await TunnelService.findOneByUsername(ctx.username, db)) ?? {};
      for (const access of accesses ?? []) {
        if (access.alias === host) {
          return {
            host: access.host,
            port: access.port,
          };
        }
      }
    },
    banner: 'Welcome to Untangled SSH Server!',
  } as ServerConfigurations);
  server.start();
}
