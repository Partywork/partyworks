import { PartyWorks, Player } from "partyworks-server";
import { gameEventEmitter } from "./EventEmitter";
import {
  ClientEvents,
  ServerEvents,
  Game,
  GameEventEmitterEvents,
  GameResults,
  Move,
  PlayerState,
} from "./types";
import { Connection, ConnectionContext } from "partykit/server";
import { GameController } from "./game/GameController";
import { CustomError } from "./errors/CustomError";
import { SOMETHING_WENT_WRONG_ERROR } from "./constants";
import { Connect4MoveData } from "./game/Connect4";

type PartyListener = {
  [ClientEvents.CREATE_GAME]: undefined;
  [ClientEvents.JOIN_GAME]: undefined;
  [ClientEvents.MAKE_MOVE]: Connect4MoveData;
  [ClientEvents.RESIGN_GAME]: undefined;
  [ClientEvents.DELETE_GAME]: undefined;
};

type PartyEmitters = {
  [ServerEvents.ROOM_STATE]: {
    game: any;
  };
};

type Broadcast = {
  [ServerEvents.GAME_CREATED]: { game: Game };
  [ServerEvents.GAME_USER_JOINED]: {
    user: { userId: string; username: string };
  };
  [ServerEvents.GAME_STARTED]: {
    gameState: any;
  };
  [ServerEvents.PLAY]: Move;
  [ServerEvents.GAME_COMPLETED]: GameResults;
};

//random names for in case the username is not present
const usernames = [
  "ace",
  "jordan",
  "clone drone",
  "party guy",
  "partykit",
  "partyworks",
  "party kid",
  "party bob",
  "party gamer",
  "party",
  "third party", //lol
  "dandadan",
  "dani",
  "nobita",
  "hehe",
  "yokai",
  "domo",
];

export default class RockPaperScissorsRoom extends PartyWorks<
  PlayerState,
  PartyListener,
  PartyEmitters,
  Broadcast
> {
  gameController = new GameController();

  setup(): void {
    gameEventEmitter.on(GameEventEmitterEvents.GAME_BROADCAST, (message) => {
      this.broadcast(message);
    });

    gameEventEmitter.on(
      GameEventEmitterEvents.INGAME_BROADCAST,
      ({ message }: { message: any }) => {
        this.broadcast(message);
      }
    );
  }

  customDataOnConnect(
    player: Player<PlayerState, PartyEmitters, any>,
    ctx: ConnectionContext
  ): void {
    let { searchParams } = new URL(ctx.request.url);

    player.setState({
      info: {
        userId: player.id,
        username:
          searchParams.get("name") ||
          usernames[Math.floor(Math.random() * usernames.length)],
      },
    });
  }

  sendEventOnConnect(player: Player<PlayerState, PartyEmitters, any>): void {
    this.send(player, {
      event: ServerEvents.ROOM_STATE,
      data: this.gameController.getState(),
    });
  }

  setCustomEvent(): void {
    this.customEvents({
      [ClientEvents.CREATE_GAME]: {
        handler: (_value, player) => {
          const game = this.gameController.createGame(player);

          this.broadcast({ event: ServerEvents.GAME_CREATED, data: { game } });
        },
      },

      [ClientEvents.JOIN_GAME]: {
        handler: (_value, player) => {
          this.gameController.joinGame(player);
          this.broadcast({
            event: ServerEvents.GAME_USER_JOINED,
            data: {
              user: {
                userId: player.state!.info.userId!,
                username: player.state!.info.username!,
              },
            },
          });
        },
      },

      [ClientEvents.MAKE_MOVE]: {
        handler: (value, player) => {
          console.log(value.data);
          this.gameController.playMove({ moveData: value.data }, player);
        },
      },

      [ClientEvents.RESIGN_GAME]: {
        handler: (_value, player) => {
          this.gameController.resignGame(player);
        },
      },
      [ClientEvents.DELETE_GAME]: {
        handler: (_value, player) => {
          this.gameController.deleteGame(player);
        },
      },
    });
  }

  catchAll(
    error: any,
    { rid, event }: { data: any; rid: any; event: any },
    player: Connection<unknown>
  ): void {
    if (error instanceof CustomError) {
      this.sendError(player, { error: error.serialize(), rid });
      return;
    }

    this.sendError(player, { error: SOMETHING_WENT_WRONG_ERROR, event, rid });

    console.log(error);
  }
}
