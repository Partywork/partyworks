import type { Peer } from "../types";

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

  getPeer(peerId: string) {
    return this._connectedPeers.get(peerId);
  }

  //ADDING USERS IN BULK, USED WHEN INITIAL ROOM STATE IS SYNCED
  addPeers(peers: Peer<TPresence, TUserMeta>[]) {
    //clear, since this is only calld on room_state
    this._connectedPeers.clear();

    for (let peer of peers) {
      this._connectedPeers.set(peer.userId, Object.freeze(peer));
    }

    this.invalidateCache();
  }

  //todo maybe return the peer from here
  addPeer(peer: Peer<TPresence, TUserMeta>) {
    this.invalidateCache();

    const frozenPeer = Object.freeze(peer);
    this._connectedPeers.set(peer.userId, frozenPeer);

    return frozenPeer;
  }

  //for now we're just only updating the peer presence
  updatePeer(
    peerId: string,
    { presence, info }: { presence?: TPresence; info?: TUserMeta }
  ) {
    const peer = this._connectedPeers.get(peerId);

    //well this should always be the case :/
    if (peer) {
      this.invalidateCache();

      const updatedPeer = { ...peer };

      if (presence !== undefined) {
        updatedPeer.presence = presence;
      }

      if (info !== undefined) {
        updatedPeer.info = info;
      }

      const frozenPeer = Object.freeze(updatedPeer);

      this._connectedPeers.set(peerId, Object.freeze(frozenPeer));
      return frozenPeer;
    }
  }

  disconnectPeer(peerId: string) {
    // Retrieve the peer before deleting it
    const deletedPeer = this._connectedPeers.get(peerId);

    if (deletedPeer) {
      this.invalidateCache();

      // Delete the peer from the map
      this._connectedPeers.delete(peerId);

      // Return the deleted peer
      return deletedPeer;
    }
  }
}
