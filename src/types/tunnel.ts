export type AddAuthorizedKey = {
  username: string;
  authorizedKey: string;
};

export type GrantAccess = {
  username: string;
  access:
    | {
        alias: string;
        host: string;
        port: number;
      }
    | {
        alias: string;
        host: string;
        port: number;
      }[];
};

export type RevokeAccess = {
  username: string;
  access: string | string[];
};
