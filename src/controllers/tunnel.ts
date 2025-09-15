import { useAppInfo } from '@untangled/boot/utils/app';
import { useSlack } from '@untangled/boot/utils/slack';
import {
  BadRequestError,
  Controller,
  Delete,
  Get,
  NotFoundError,
  Patch,
  Post,
} from '@untangled/core/http';
import { Auth, type AuthReq } from '@untangled/middlewares/auth';
import { TunnelService } from '@/services';
import { tunnelDatabase } from '@/tunnel';
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
      const { appLink } = useAppInfo.forSlack();
      const { client, builder } = useSlack();
      await client.send(
        builder.message({
          title: `*${req._auth.email}* added an authorized key for *${username}* via ${appLink}.`,
        })
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
      const { appLink } = useAppInfo.forSlack();
      const { client, builder } = useSlack();
      const access = accesses
        .map(({ alias }) => alias)
        .map((access) => `*${access}*`)
        .join(', ');
      await client.send(
        builder.message({
          title: `*${req._auth.email}* allowed *${username}* to access ${access} via ${appLink}.`,
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
      const { appLink } = useAppInfo.forSlack();
      const { client, builder } = useSlack();
      const access = accesses.map((access) => `*${access}*`).join(', ');
      await client.send(
        builder.message({
          title: `*${req._auth.email}* removed *${username}*'s access to ${access} via ${appLink}.`,
        })
      );
    });
    return { username, deleted: accesses };
  }
}
