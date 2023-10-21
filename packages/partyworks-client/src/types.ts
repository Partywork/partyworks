export interface BaseUser {
  data: {
    id: string; //internal partykit id or something
    // _pkUrl: string;
  };
}

export type Peer<TPresence = any, TUserMeta = any> = {
  readonly userId: string;
  readonly presence?: TPresence;
  readonly info: TUserMeta;
  // readonly data: any // ? this can be the data of the user
};

//todo self can have other data maybe,
export interface Self<TPresence = any, TUserMeta = any> extends BaseUser {
  info: TUserMeta;
  presence?: TPresence;
}
