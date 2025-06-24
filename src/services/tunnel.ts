import { MongoBean } from '@untangled/connectors/mongo';
import Tunnel from '@/models/Tunnel';

/**
 * Retrieves tunneling configurations for a given username.
 * @param username the username.
 * @param mongo to use another {@link MongoBean} if specified.
 */
export async function findOneByUsername(username: string, mongo?: MongoBean) {
  return Tunnel.use(mongo)
    .findOne({
      username,
    })
    .lean();
}

/**
 * Adds an SSH public key of a given username for authorization.
 * @param username the username.
 * @param authorizedKey the SSH public key.
 * @param mongo to use another {@link MongoBean} if specified.
 */
export async function addAuthorizedKey(
  username: string,
  authorizedKey: string,
  mongo?: MongoBean
) {
  await Tunnel.use(mongo).updateOne(
    {
      username,
    },
    {
      $push: {
        authorizedKeys: authorizedKey,
      },
    },
    {
      upsert: true,
    }
  );
}

/**
 * Grants a given username with an access to some specific addresses.
 * @param username the username.
 * @param accesses the addresses.
 * @param mongo to use another {@link MongoBean} if specified.
 */
export async function grantAccess(
  username: string,
  accesses: {
    /**
     * A unique name for the address.
     */
    alias: string;
    /**
     * Host of the address.
     */
    host: string;
    /**
     * Port of the address.
     */
    port: number;
  }[],
  mongo?: MongoBean
) {
  const access = accesses.filter((a) => !!a);
  if (!access.length) return;
  await Tunnel.use(mongo).updateOne(
    {
      username,
    },
    {
      $push: {
        accesses: {
          $each: access,
        },
      },
    },
    {
      upsert: true,
    }
  );
}

/**
 * Revokes a given username's access to some specific addresses.
 * @param username the username.
 * @param accesses the addresses.
 * @param mongo to use another {@link MongoBean} if specified.
 */
export async function revokeAccess(
  username: string,
  accesses: string[],
  mongo?: MongoBean
) {
  const access = accesses.filter((a) => !!a);
  if (!access.length) return;
  await Tunnel.use(mongo).updateOne(
    {
      username,
    },
    {
      $pullAll: {
        accesses: {
          alias: {
            $in: access,
          },
        },
      },
    },
    {
      upsert: true,
    }
  );
}
