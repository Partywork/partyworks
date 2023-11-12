import { PartyWorks, Player } from "partyworks-server";

type PlayerState = {
  //info prop will be synced to the clients, it's used as the meta
  info: {
    color: string;
  };
};

const COLORS = [
  "#E57373",
  "#9575CD",
  "#4FC3F7",
  "#81C784",
  "#FFF176",
  "#FF8A65",
  "#F06292",
  "#7986CB",
];

//* Magic
export default class LiveCursors extends PartyWorks<PlayerState> {
  customDataOnConnect(player: Player<PlayerState>): void {
    player.setState({
      info: {
        color: COLORS[Math.floor(Math.random() * 9) % COLORS.length],
      },
    });
  }
}
