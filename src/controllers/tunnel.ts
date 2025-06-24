import {
  BadRequestError,
  Controller,
  Delete,
  Get,
  NotFoundError,
  Patch,
  Post,
} from '@untangled/core/http';
import { Auth, AuthReq } from '@untangled/middlewares/auth';
import { TunnelService } from '@/services';
import { tunnelDatabase } from '@/tunnel';
import { useSlack } from '@/utils/slack';
import { AddAuthorizedKey, GrantAccess, RevokeAccess } from '@/types/tunnel';

@Controller()
export class TunnelController {
  /**
   * A {@link BadRequestError} should be thrown when any
   * required field is missing.
   */
  private get requiredFieldsMissingError() {
    return new BadRequestError('Missing required fields');
  }

  /**
   * Connected database.
   */
  private get db() {
    return tunnelDatabase();
  }

  @Get('/users/:username')
  @Auth('tunnel:view')
  async user(req: AuthReq) {
    const username = req.params.username;
    const found = await TunnelService.findOneByUsername(username, this.db);
    if (!found) {
      throw new NotFoundError(`No tunnel for ${username}`);
    }
    return found;
  }

  @Post('/keys')
  @Auth('tunnel:edit')
  async addAuthorizedKey(req: AuthReq<AddAuthorizedKey>) {
    const { username, authorizedKey } = req.body ?? {};
    if (!username || !authorizedKey) {
      throw this.requiredFieldsMissingError;
    }
    await TunnelService.addAuthorizedKey(username, authorizedKey, this.db);
    setImmediate(async () => {
      const { client, builder } = useSlack();
      await client.send(
        builder.authorizedKeyAdded(req._auth.email, { username })
      );
    });
    return { username };
  }

  @Patch('/access')
  @Auth('tunnel:edit')
  async grantAccess(req: AuthReq<GrantAccess>) {
    const { username, access } = req.body ?? {};
    if (!username || !access) {
      throw this.requiredFieldsMissingError;
    }
    const accesses = [access].flat();
    await TunnelService.grantAccess(username, accesses, this.db);
    setImmediate(async () => {
      const { client, builder } = useSlack();
      await client.send(
        builder.accessGranted(req._auth.email, {
          username,
          accesses: accesses.map(({ alias }) => alias),
        })
      );
    });
    return { username, added: accesses.map(({ alias }) => alias) };
  }

  @Delete('/access')
  @Auth('tunnel:edit')
  async revokeAccess(req: AuthReq<RevokeAccess>) {
    const { username, access } = req.body ?? {};
    if (!username || !access) {
      throw this.requiredFieldsMissingError;
    }
    const accesses = [access].flat();
    await TunnelService.revokeAccess(username, accesses, this.db);
    setImmediate(async () => {
      const { client, builder } = useSlack();
      await client.send(
        builder.accessRevoked(req._auth.email, {
          username,
          accesses,
        })
      );
    });
    return { username, deleted: accesses };
  }
}
