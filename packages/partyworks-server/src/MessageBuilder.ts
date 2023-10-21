import { PartyworksEvents } from "partyworks-shared";
import { Player } from "./types";
import type * as Party from "partykit/server";

export class MessageBuilder {
  static connect(player: Player, data: any) {
    return {
      event: PartyworksEvents.CONNECT,
      data,
    };
  }

  static roomState({
    self,
    info,
    users,
    roomData,
  }: {
    self: Player;
    info: any;
    users: Player[];
    roomData: any;
  }) {
    return {
      event: PartyworksEvents.ROOM_STATE,
      data: {
        self: {
          data: {
            id: self.id,
          },
          info,
        },
        users: users.map((player) => ({
          userId: player.id,
          presence: player.presence,
          info: player.state?.info,
        })),

        roomData,
      },
      _pwf: "-1",
    };
  }

  static userOnline(player: Player) {
    return {
      event: PartyworksEvents.USER_JOINED,
      data: {
        userId: player.id,
        presence: player.presence,
        info: player.state?.info,
      },
      _pwf: "-1",
    };
  }

  static userOffline(player: Party.Connection) {
    return {
      event: PartyworksEvents.USER_LEFT,
      data: {
        userId: player.id,
      },
      _pwf: "-1",
    };
  }

  static presenceUpdate(player: Player) {
    return {
      event: PartyworksEvents.PRESENSE_UPDATE,
      data: {
        userId: player.id,
        data: player.presence,
      },
      _pwf: "-1",
    };
  }

  static metaUpdate(player: Player) {
    return {
      event: PartyworksEvents.USERMETA_UPDATE,
      data: {
        userId: player.id,
        data: player.state?.info,
      },
      _pwf: "-1",
    };
  }

  static broadcastEvent(player: Player, data: any) {
    return {
      event: PartyworksEvents.BROADCAST,
      data: {
        userId: player.id,
        data,
      },
      _pwf: "-1",
    };
  }
}
