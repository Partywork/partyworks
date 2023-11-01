import { Connection } from "partykit/server";
import { PartyWorks } from "partyworks-server";

//* Magic
export default class LiveCursors extends PartyWorks {
  //eventually ping/pong can be handled by partyworks itself
  onMessage(message: string, sender: Connection<unknown>) {
    if (message === "PING") {
      sender.send("PONG");
    }
  }
}
