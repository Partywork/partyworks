import { PartyworksEvents } from "partyworks-shared";

export type PresenceUpdateMessage = {
  event: PartyworksEvents.PRESENSE_UPDATE;
  data: { data: any; type: "set" | "partial" };
  _pwf: "-1";
};

export type BroadcastMessage = {
  event: PartyworksEvents.BROADCAST;
  data: any;
  _pwf: "-1";
};

export type EmitMessage = {
  event: string | number | symbol;
  data: any;
  _pwf: "-1";
};

export class MessageBuilder {
  static batchUpdateMessage(
    messages: (PresenceUpdateMessage | BroadcastMessage | EmitMessage)[]
  ) {
    return {
      event: PartyworksEvents.BATCH,
      data: messages,
      _pwf: "-1",
    };
  }

  static updatePresenceMessage(data: {
    data: any;
    type: "set" | "partial";
  }): PresenceUpdateMessage {
    return {
      event: PartyworksEvents.PRESENSE_UPDATE,
      data,
      _pwf: "-1",
    };
  }

  static broadcastMessage(data: any): BroadcastMessage {
    return {
      event: PartyworksEvents.BROADCAST,
      data,
      _pwf: "-1",
    };
  }

  static emitMessage(event: string | number | symbol, data: any): EmitMessage {
    return {
      event: PartyworksEvents.EVENT,
      data: {
        event,
        data,
      },
      _pwf: "-1",
    };
  }

  static emitAwaitMessage({
    event,
    data,
    rid,
  }: {
    event: string | number | symbol;
    data: any;
    rid: string;
  }) {
    return {
      event: PartyworksEvents.EVENT,
      data: {
        event,
        data,
      },
      rid,
      _pwf: "-1",
    };
  }
}
