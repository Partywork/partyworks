import { INVALID_MOVE_ERROR, NOT_YOUR_TURN_ERROR } from "../constants";
import { BadRequestError } from "../errors/BadRequestError";
import { gameEventEmitter } from "../EventEmitter";
import { MessageBuilder } from "../MessageBuilder";
import {
  GameContructorData,
  GameEventEmitterEvents,
  GameResults,
  GameResultStatus,
  Move,
  GamePlayer as Player,
} from "../types";
import { GameHandler } from "./GameHandler";

//? maybe we would want to add like a (best of 3) or something, that is configurable by the user
//?this way we can easily create more matches, for these kind of games. that included mini game like 'rock-paper-scissors'
type TicTacToeGameState = ("x" | "o" | null)[];
type TicTacToePlayer = { userId: string; username: string; role: "x" | "o" };
export type TicTacToeMoveData = { index: number };

export class TicTacToeGame extends GameHandler<
  TicTacToeGameState,
  TicTacToePlayer,
  TicTacToeMoveData
> {
  protected players: TicTacToePlayer[];
  protected gameState = Array(9).fill(null);
  protected results?: GameResults;

  private currentPlayer: string;
  private moveCount = 0;
  private timeAllotedPerMove: number = 15000; //? maybe a configurable proeperty
  private extraBufferPerMove: number = 1200; //? maybe a configurable property
  private currentTimeout?: NodeJS.Timeout; // this is the actual nodejs timeout
  private currentTimeoutDate?: number; // this is the date when the current timeout will expire. used for ui timer progress synchronization

  constructor({ id, players }: GameContructorData) {
    super(id);
    this.players = this.shuffleRoles(players);
    this.currentPlayer =
      players[Math.floor(Math.random() * this.players.length)].userId;
    this.startTimeout();
  }

  private shuffleRoles(
    players: GameContructorData["players"]
  ): TicTacToePlayer[] {
    const shuffledRoles = ["x", "o"].sort(() => Math.random() - 0.5);
    return players.map((player, index) => ({
      userId: player.userId,
      username: player.username,
      role: shuffledRoles[index] as "x" | "o",
    }));
  }

  getState() {
    return {
      id: this.id,
      players: this.players,
      gameState: this.gameState,
      currentPlayer: this.currentPlayer,
      results: this.results,
      currentTimeoutDate: this.currentTimeoutDate,
    };
  }

  getResults() {
    return this.results;
  }

  private startTimeout = () => {
    if (this.currentTimeout) {
      clearTimeout(this.currentTimeout);
    }
    this.currentTimeout = setTimeout(
      () => this.forfietPlayer(),
      this.timeAllotedPerMove
    );
    this.currentTimeoutDate = Date.now() + this.timeAllotedPerMove - 500; //.5 seconds is the grace period
  };

  // we need an abilit to broadcase messages form here, or send an event to the controller to do it
  private forfietPlayer() {
    //assuming we will send it via an event or something

    if (this.currentTimeout) {
      clearInterval(this.currentTimeout);
    }
    this.results = [
      { playerId: this.currentPlayer, result: GameResultStatus.INACTIVITY },
      {
        playerId: this.players.find(
          (player) => player.userId !== this.currentPlayer
        )!.userId,
        result: GameResultStatus.WIN,
      },
    ];

    gameEventEmitter.emit(GameEventEmitterEvents.CONCLUDE, this.id);
  }

  private checkWinner(player: "x" | "o"): boolean {
    const winningCombinations = [
      [0, 1, 2],
      [3, 4, 5],
      [6, 7, 8], // Rows
      [0, 3, 6],
      [1, 4, 7],
      [2, 5, 8], // Columns
      [0, 4, 8],
      [2, 4, 6], // Diagonals
    ];

    for (const combination of winningCombinations) {
      const [a, b, c] = combination;
      if (
        this.gameState[a] === player &&
        this.gameState[b] === player &&
        this.gameState[c] === player
      ) {
        return true;
      }
    }

    return false;
  }

  playMove({
    moveData,
    player,
  }: {
    moveData: TicTacToeMoveData;
    player: Player;
  }) {
    if (this.currentPlayer !== player.userId)
      throw new BadRequestError(NOT_YOUR_TURN_ERROR);

    const currentPlayer = this.players.find(
      (gamePlayer) => gamePlayer.userId === player.userId
    )!;

    //here this is also checking for out of range index
    if (this.gameState[moveData.index] !== null)
      throw new BadRequestError(INVALID_MOVE_ERROR);

    this.gameState[moveData.index] = currentPlayer.role;
    this.currentPlayer = this.players.find(
      (gamePlayer) => gamePlayer.userId !== player.userId
    )!.userId;
    this.moveCount++;
    this.startTimeout();

    const move: Move = {
      id: this.id,
      player: {
        userId: player.userId,
      },
      moveData: {
        cellIndex: moveData.index,
      },
      currentPlayer: this.players.find(
        (gamePlayer) => gamePlayer.userId !== player.userId
      )!.userId,
      currentPlayerTimeout: this.currentTimeoutDate!,
    };

    if (this.checkWinner(currentPlayer.role)) {
      this.results = [
        { playerId: currentPlayer.userId, result: GameResultStatus.WIN },
        {
          playerId: this.players.find(
            (gamePlayer) => gamePlayer.userId !== player.userId
          )!.userId,
          result: GameResultStatus.LOST,
        },
      ];

      clearTimeout(this.currentTimeout);

      gameEventEmitter.emit(GameEventEmitterEvents.INGAME_BROADCAST, {
        id: this.id,
        message: MessageBuilder.makeMove({ id: this.id, move }),
      });

      gameEventEmitter.emit(GameEventEmitterEvents.CONCLUDE, this.id);

      return;
    }

    if (this.moveCount === 9) {
      this.results = [
        { playerId: this.players[0].userId, result: GameResultStatus.DRAW },
        { playerId: this.players[1].userId, result: GameResultStatus.DRAW },
      ];

      clearTimeout(this.currentTimeout);

      gameEventEmitter.emit(GameEventEmitterEvents.INGAME_BROADCAST, {
        id: this.id,
        message: MessageBuilder.makeMove({ id: this.id, move }),
      });

      gameEventEmitter.emit(GameEventEmitterEvents.CONCLUDE, this.id);

      return;
    }

    gameEventEmitter.emit(GameEventEmitterEvents.INGAME_BROADCAST, {
      id: this.id,
      message: MessageBuilder.makeMove({ id: this.id, move }),
    });

    return;
  }

  resignGame(playerId: string) {
    if (this.currentTimeout) {
      clearInterval(this.currentTimeout);
    }
    this.results = [
      {
        playerId: this.players.find((player) => player.userId === playerId)!
          .userId,
        result: GameResultStatus.RESIGN,
      },
      {
        playerId: this.players.find((player) => player.userId !== playerId)!
          .userId,
        result: GameResultStatus.WIN,
      },
    ];

    gameEventEmitter.emit(GameEventEmitterEvents.CONCLUDE, this.id);
  }
}
