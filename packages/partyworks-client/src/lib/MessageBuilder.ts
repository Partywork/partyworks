import { InternalEvents } from "../types";

export class MessageBuilder {
  static updatePresenceMessage(data: { data: any; type: "set" | "partial" }) {
    return {
      event: InternalEvents.PRESENSE_UPDATE,
      data,
      _pwf: "-1",
    };
  }

  static broadcastMessage(data: any) {
    return {
      event: InternalEvents.BROADCAST,
      data,
      _pwf: "-1",
    };
  }

  static emitMessage(event: string | number | symbol, data: any) {
    return {
      event,
      data,
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
      event,
      data,
      rid,
      _pwf: "-1",
    };
  }
}
