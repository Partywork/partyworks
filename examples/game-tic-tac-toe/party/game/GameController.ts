import { uuid } from "@cfworker/uuid";

import {
  CANNOT_DELETE_GAME_ERROR,
  GAME_ALREADY_JOINED_ERROR,
  GAME_CONCLUDED_ERROR,
  GAME_DELETED_ERROR,
  GAME_IS_FULL_ERROR,
  GAME_LIMIT_EXCEEDED_ERROR,
  GAME_NOT_AVAILABLE_ERROR,
} from "../constants";
import { BadRequestError } from "../errors/BadRequestError";
import { NotAuthorizedError } from "../errors/NotAuthorizedError";
import { NotFoundError } from "../errors/NotFoundError";
import { gameEventEmitter } from "../EventEmitter";
import { GameHandler } from "./GameHandler";
import { MessageBuilder } from "../MessageBuilder";
import {
  Game,
  GameEventEmitterEvents,
  GameStatus,
  PartyPlayer,
} from "../types";
import { TicTacToeGame } from "./TicTacToeGame";

// Define an interface for the game class type
interface GameHandlerConstructor<T extends GameHandler> {
  new (...args: any[]): T;
}

// Create the gamesMap with correct type annotations
const gamesMap: Record<string, GameHandlerConstructor<GameHandler>> = {
  "tic-tac-toe": TicTacToeGame,
};

export class GameController {
  game?: Game;

  constructor() {
    gameEventEmitter.on(GameEventEmitterEvents.CONCLUDE, () =>
      this.concludeGame()
    );
  }

  createGame(player: PartyPlayer) {
    //? we may want to limit the number of concurrent games per room :/ dunno what the number should be.
    //? or we don't care, cuz we're gonna anyways be implementing a subscription based game updates. who knows.

    if (this.game) throw new BadRequestError(GAME_LIMIT_EXCEEDED_ERROR);

    const game: Game = {
      id: uuid(),
      gameId: "tic-tac-toe", //hardcoding for now, since it's the only game available
      gameStatus: GameStatus.CREATED,
      createdBy: { userId: player.id },
      players: [
        {
          userId: player.state?.info.userId!,
          username: player.state?.info.username!,
        },
      ],
      minPlayersRequired: 2,
      maxPlayersLimit: 2,
    };

    this.game = game;

    return game;
  }

  joinGame(player: PartyPlayer) {
    if (!this.game) throw new NotFoundError();

    if (this.game.gameStatus !== GameStatus.CREATED)
      throw new BadRequestError(GAME_NOT_AVAILABLE_ERROR);

    //this case should not happen, it's defensive coding. also maybe will be useful for purely manual games.
    const maxPlayersReached =
      this.game.players.length >= this.game.maxPlayersLimit;

    if (maxPlayersReached) throw new BadRequestError(GAME_IS_FULL_ERROR);

    const hasJoined = this.game.players.find(
      ({ userId }) => userId === player.id
    );

    if (hasJoined) throw new BadRequestError(GAME_ALREADY_JOINED_ERROR);

    this.game.players.push({
      userId: player.state?.info.userId!,
      username: player.state?.info.username!,
    });

    try {
      this.startGame();
    } catch (error) {
      //we don't care for this
    }
  }

  //this is for autoStart
  startGame() {
    const game = this.game;
    //ideally on autoStart games these errors should not occur

    if (!game) {
      console.error(
        `game to start not foud. ideally this should never happen on autoStart games`
      );

      //? if encoutering this error, a cleanup message should be sent?
      throw new NotFoundError();
    }

    if (game.gameStatus === GameStatus.DELETED)
      throw new BadRequestError(GAME_DELETED_ERROR);
    if (game.gameStatus !== GameStatus.CREATED)
      throw new BadRequestError("Cannot start the game");
    if (game.minPlayersRequired > game.players.length)
      throw new BadRequestError("Not enough players");

    game.gameHandler = new gamesMap[game.gameId]({
      players: [...game.players],
    });
    game.gameStatus = GameStatus.STARTED;

    const message = MessageBuilder.gameStarted(game);

    //? should this directly send the message & event to broadcast, keeping the actual funrooms dummy, and only a broadcaster
    //? how're we gona handle it in case of rid events
    //? so maybe adding only for events that're initiated from server
    //? ok since we're not sending user joined ffrom here, it's cauing start game to be broadcasted first, we can't do that blud
    setTimeout(() => {
      gameEventEmitter.emit(GameEventEmitterEvents.GAME_BROADCAST, message);
    }, 500);
  }

  concludeGame() {
    const game = this.game;

    if (!game) return;

    //we should return, cuz the only one changin this is our game handler
    if (game.gameStatus !== GameStatus.STARTED) return;

    game.gameStatus = GameStatus.COMPLETED;
    game.results = game.gameHandler!.getResults();

    //? maybe we should send 2 events
    //? one is for everyone/ the other is for ingame

    const message = MessageBuilder.gameConcluded(game);

    gameEventEmitter.emit(GameEventEmitterEvents.GAME_BROADCAST, message);
    this.game = undefined;
  }

  playMove({ moveData }: { moveData: any }, player: PartyPlayer) {
    const game = this.game;

    if (!game) throw new NotFoundError();

    //for typescript to be happy :/
    if (!game) throw new NotFoundError();

    if (game.gameStatus === GameStatus.DELETED)
      throw new BadRequestError(GAME_DELETED_ERROR);
    if (game.gameStatus !== GameStatus.STARTED)
      throw new BadRequestError(GAME_CONCLUDED_ERROR);

    const hasJoined = game.players.find(({ userId }) => userId === player.id);

    if (!hasJoined) throw new NotAuthorizedError();

    //this should  nver happen
    if (!game.gameHandler) return;

    game.gameHandler.playMove({
      moveData,
      player: {
        userId: player.state?.info.userId!,
        username: player.state?.info.username!,
      },
    });
  }

  resignGame(player: PartyPlayer) {
    const game = this.game;

    if (!game) throw new NotFoundError();

    if (game.gameStatus === GameStatus.DELETED)
      throw new BadRequestError(GAME_DELETED_ERROR);

    //cannot resign a game if it's not in started state
    if (game.gameStatus !== GameStatus.STARTED)
      throw new BadRequestError(GAME_CONCLUDED_ERROR);

    //if the player has not joined the game
    const hasJoined = game.players.find(({ userId }) => userId === player.id);

    if (!hasJoined) throw new NotAuthorizedError();

    //here the game is started & player is in the game
    game.gameHandler!.resignGame(player.id);
  }

  deleteGame(player: PartyPlayer) {
    const game = this.game;

    if (!game) throw new NotFoundError();
    if (game.createdBy.userId !== player.id) throw new NotAuthorizedError();

    if (game.gameStatus !== GameStatus.CREATED)
      throw new BadRequestError(CANNOT_DELETE_GAME_ERROR);

    game.gameStatus = GameStatus.DELETED;

    const message = MessageBuilder.gameDeleted(game);

    gameEventEmitter.emit(GameEventEmitterEvents.GAME_BROADCAST, message);

    // Remove the game from the array
    this.game = undefined;
  }

  getState() {
    const game = this.game
      ? {
          ...this.game,
          gameState: this.game.gameHandler?.getState(),
          gameHandler: undefined,
        }
      : undefined;

    return { game };
  }
}
