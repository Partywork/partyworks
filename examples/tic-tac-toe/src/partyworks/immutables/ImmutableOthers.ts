export type Peer<TPresence = any, TUserMeta = any> = {
  readonly userId: string;
  readonly presence?: TPresence;
  readonly info: TUserMeta;
  // readonly data: any // ? this can be the data of the user
};

export class ImmutablePeers<TPresence, TUserMeta> {
  //this neeeds to have a map of others
  private cachedPeers: Peer<TPresence, TUserMeta>[] | undefined;

  private _connectedPeers: Map<string, Peer<TPresence, TUserMeta>> = new Map();

  private _toImmutable(): Peer<TPresence, TUserMeta>[] {
    const peers = Array.from(this._connectedPeers.values());

    return peers;
  }

  private invalidateCache() {
    this.cachedPeers = undefined;
  }

  get current() {
    if (!this.cachedPeers) this.cachedPeers = this._toImmutable();
    return this.cachedPeers;
  }

  //ADDING USERS IN BULK, USED WHEN INITIAL ROOM STATE IS SYNCED
  addPeers(peers: Peer<TPresence, TUserMeta>[]) {
    for (let peer of peers) {
      this._connectedPeers.set(peer.userId, Object.freeze(peer));
    }

    this.invalidateCache();
  }

  addPeer(peer: Peer<TPresence, TUserMeta>) {
    this.invalidateCache();
    this._connectedPeers.set(peer.userId, Object.freeze(peer));
  }

  //for now we're just only updating the peer presence
  updatePeer(peerId: string, presence: TPresence) {
    const peer = this._connectedPeers.get(peerId);

    //well this should always be the case :/
    if (peer) {
      this.invalidateCache();
      this._connectedPeers.set(peerId, Object.freeze({ ...peer, presence }));
    }
  }

  disconnectPeer(peerId: string) {
    this.invalidateCache();
    this._connectedPeers.delete(peerId);
  }
}
