import { Connection } from "partykit/server";
import { PartyWorks, Player } from "partyworks-server";
import { MessageBuilder } from "./messageBuilder";
import { GameController, gameEventEmitter } from "./funrooms";
import { ClientEvents, EventType, Game, GameResults, Move } from "./types";
import { CustomError } from "./errors/CustomError";
import { BadRequestError } from "./errors/BadRequestError";

type PlayerState = {
  //info field is considered as UserMeta & will be sent to everyone in the room & synced on update
  info: { userId: Player["id"]; username: string };
};

type PartyListener = {
  [ClientEvents.CREATE_GAME]: "tic-tac-toe";
  [ClientEvents.JOIN_GAME]: "tic-tac-toe";
  [ClientEvents.MAKE_MOVE]: { index: number };
};

type PartyEmitters = {
  [EventType.ROOM_STATE]: {
    currentGame: any;
  };
};

type Broadcast = {
  [EventType.GAME_CREATED]: { game: Game };
  [EventType.GAME_USER_JOINED]: {
    user: { userId: string; username: string };
  };
  [EventType.GAME_STARTED]: {
    gameState: any;
  };
  [EventType.PLAY]: Move;
  [EventType.GAME_COMPLETED]: GameResults;
};

const usernames = [
  "cream",
  "ending",
  "sasso",
  "ace",
  "yawnz",
  "yayna",
  "kafka",
  "knobbie",
  "bhuvan",
  "naz",
  "throttl",
];

export default class Funrooms extends PartyWorks<
  PlayerState,
  PartyListener,
  PartyEmitters,
  Broadcast
> {
  gameController = new GameController();

  setup(): void {
    gameEventEmitter.on("conclude", () => {
      this.gameController.concludeGame();
      const message = JSON.stringify(
        MessageBuilder.gameCompleted(
          this.gameController!.currentGame!.gameHandler!.getResults()!
        )
      );
      this.party.broadcast(message);
    });
  }

  customDataOnConnect(player: Player<PlayerState>): void {
    player.setState({
      info: {
        userId: player.id,
        username: usernames[Math.floor(Math.random() * usernames.length)],
      },
    });
  }

  //ok so i've settled with a sendData funtion it sounds similar to send
  //this way we also still give the complete freedom to use .send
  sendEventOnConnect(player: Player<PlayerState, PartyEmitters>): void {
    // player.sendData(EventType, "tic-tac-toe");
    this.send(player, {
      event: EventType.ROOM_STATE,
      data: { currentGame: this.gameController.getState() },
    });
  }

  setCustomEvent(): void {
    this.customEvents({
      [ClientEvents.CREATE_GAME]: {
        validator(data) {
          if (data !== "tic-tac-toe") {
            throw new BadRequestError("what this is not a known game bruh!");
          }
        },
        handler: ({ data }, player) => {
          const gameCreated = this.gameController.createGame(
            data,

            {
              id: player.state!.info.userId,
              data: { name: player.state!.info.username },
            }
          );

          if (gameCreated) {
            this.broadcast({
              event: EventType.GAME_CREATED,
              data: { game: this.gameController.currentGame! },
            });
          }
        },
      },

      [ClientEvents.JOIN_GAME]: {
        handler: ({ data }, player) => {
          const playerJoined = this.gameController.joinGame({
            id: player.state!.info.userId,
            data: {
              name: player.state!.info.username,
            },
          });

          if (playerJoined) {
            this.broadcast({
              event: EventType.GAME_USER_JOINED,
              data: {
                user: {
                  userId: player.state!.info.userId,
                  username: player.state!.info.username,
                },
              },
            });

            const startable = this.gameController.startGame();

            if (startable) {
              this.broadcast({
                event: EventType.GAME_STARTED,
                data: this.gameController.currentGame!.gameHandler!.getCurrentState(),
              });
            }
          }
        },
      },
      [ClientEvents.MAKE_MOVE]: {
        handler: ({ data }, player) => {
          const madeMove =
            this.gameController.currentGame?.gameHandler?.makeMove({
              movePlayer: {
                id: player.state!.info.userId,
                data: { name: player.state!.info.username },
              },
              moveData: data,
            });

          if (madeMove) {
            this.broadcast({
              event: EventType.PLAY,
              data: madeMove,
            });

            if (madeMove.conclude) {
              this.gameController.concludeGame();

              this.broadcast({
                event: EventType.GAME_COMPLETED,
                data: this.gameController!.currentGame!.gameHandler!.getResults()!,
              });
            }
          }
        },
      },
    });
  }

  //this is the catch alll handler for errors sent by custom events
  catchAll(
    error: any,
    { event }: { data: any; rid: any; event: any },
    player: Connection<unknown>
  ): void {
    if (error instanceof CustomError) {
      console.log(`user thrown error`);
      console.log(error.serialize());

      this.sendError(player, { error: error.serialize(), event });
      // this.send(player, {data})

      return;
    }

    console.log(`unknown system error`);
    console.log(error);
  }

  notFound(parsedData: any, player: Connection<unknown>): void {
    this.sendError(player, {
      error: { status: 404, reason: "Not found event" },
      event: "not-found", //if we want to listen for this event in a sepratae hook we can use useError("not-found")
    });
  }
}
