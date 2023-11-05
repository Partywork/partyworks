import {
  GAME_CONCLUDED_ERROR,
  INVALID_MOVE_ERROR,
  NOT_YOUR_TURN_ERROR,
} from "../constants";
import { BadRequestError } from "../errors/BadRequestError";
import { gameEventEmitter } from "../EventEmitter";
import { MessageBuilder } from "../MessageBuilder";
import {
  GameContructorData,
  GameEventEmitterEvents,
  GamePlayer as Player,
  GameResults,
  GameResultStatus,
  Move,
} from "../types";
import { GameHandler } from "./GameHandler";

enum ConnectFourCellState {
  Empty = "",
  Blue = "X", // 'X' for Player 1
  Red = "O", // 'O' for Player 2
}

type Connect4Player = {
  userId: string;
  username: string;
  role: ConnectFourCellState;
};
type Connect4GameState = ConnectFourCellState[][];
export type Connect4MoveData = { rowIndex: number; cellIndex: number };

const Connect4BoardRows = 7;
const Connect4BoardColumns = 6;

export class Connect4Game extends GameHandler<
  Connect4GameState,
  Connect4Player,
  Connect4MoveData
> {
  protected players: Connect4Player[] = [];
  protected gameState: ConnectFourCellState[][] = Array.from(
    { length: Connect4BoardRows },
    () => Array(Connect4BoardColumns).fill(ConnectFourCellState.Empty)
  );
  protected results?: GameResults;

  private currentPlayer: string;
  private moveCount = 0; //the movecount
  private currentTimeout?: NodeJS.Timeout; //this is the timeout for timers
  private currentTimeoutDate?: number; // this is the date when the current timeout will expire. used for ui timer progress synchronization
  private timeAllotedPerMove: number = 15000; //? maybe a configurable proeperty

  constructor({ id, players }: GameContructorData) {
    super(id);
    this.players = this.shuffleRoles(players);
    this.startTimeout();
    this.currentPlayer =
      players[Math.floor(Math.random() * this.players.length)].userId;
  }

  private shuffleRoles(
    players: GameContructorData["players"]
  ): Connect4Player[] {
    const shuffledRoles = [
      ConnectFourCellState.Blue,
      ConnectFourCellState.Red,
    ].sort(() => Math.random() - 0.5);
    return players.map((player, index) => ({
      userId: player.userId,
      username: player.username,
      role: shuffledRoles[index],
    }));
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

  private checkDirection = (
    board: ConnectFourCellState[][],
    row: number,
    column: number,
    directionX: number,
    directionY: number,
    player: ConnectFourCellState
  ) => {
    const rows = board.length;
    const columns = board[0].length;
    let count = 0;

    // Check in the specified direction for consecutive player tokens
    for (let i = -3; i <= 3; i++) {
      const newRow = row + directionY * i;
      const newColumn = column + directionX * i;

      // Check if the new coordinates are within bounds
      if (
        newRow >= 0 &&
        newRow < rows &&
        newColumn >= 0 &&
        newColumn < columns &&
        board[newRow][newColumn] === player
      ) {
        count++;
        if (count === 4) {
          // Four consecutive tokens found; the player wins
          return true;
        }
      } else {
        // Reset the count if there's a gap or the edge of the board is reached
        count = 0;
      }
    }

    return false;
  };

  // Function to check for a win on the entire board
  private checkWinner = (player: ConnectFourCellState) => {
    const rows = this.gameState.length;
    const columns = this.gameState[0].length;

    // Iterate through each cell on the board
    for (let row = 0; row < rows; row++) {
      for (let column = 0; column < columns; column++) {
        // Check for a win in all directions (horizontal, vertical, and diagonals)
        if (
          this.checkDirection(this.gameState, row, column, 1, 0, player) || // Horizontal
          this.checkDirection(this.gameState, row, column, 0, 1, player) || // Vertical
          this.checkDirection(this.gameState, row, column, 1, 1, player) || // Diagonal (top-left to bottom-right)
          this.checkDirection(this.gameState, row, column, -1, 1, player) // Diagonal (top-right to bottom-left)
        ) {
          return true; // Player has won
        }
      }
    }

    return false; // No winner found
  };

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

  playMove({
    moveData,
    player,
  }: {
    moveData: Connect4MoveData;
    player: Player;
  }): void {
    //this should never be the case, since game controlled will handle it for us, still defensive coding for edge cases
    if (this.results) throw new BadRequestError(GAME_CONCLUDED_ERROR);
    if (this.currentPlayer !== player.userId)
      throw new BadRequestError(NOT_YOUR_TURN_ERROR);

    const { rowIndex, cellIndex } = moveData;
    if (rowIndex >= Connect4BoardRows || cellIndex >= Connect4BoardColumns)
      throw new BadRequestError(INVALID_MOVE_ERROR);

    if (this.gameState[rowIndex][cellIndex] !== ConnectFourCellState.Empty)
      throw new BadRequestError(INVALID_MOVE_ERROR);

    //if this is not the bottom most cell, we ned to check if the cell below this is not empty
    if (cellIndex !== 5) {
      //CHECK And see if the move is valid itself

      //if it's not the bottom most
      const belowCell = this.gameState[rowIndex][cellIndex + 1];

      if (belowCell === ConnectFourCellState.Empty)
        throw new BadRequestError(INVALID_MOVE_ERROR);
    }

    const currentPlayer = this.players.find(
      (gamePlayer) => gamePlayer.userId === player.userId
    )!;

    //apply the move
    this.gameState[rowIndex][cellIndex] = currentPlayer.role;
    this.currentPlayer = this.players.find(
      (gamePlayer) => gamePlayer.userId !== player.userId
    )!.userId;
    this.startTimeout();
    this.moveCount++;

    const move: Move = {
      id: this.id,
      player: {
        userId: player.userId,
      },
      moveData: {
        rowIndex: moveData.rowIndex,
        cellIndex: moveData.cellIndex,
      },
      currentPlayer: this.players.find(
        (gamePlayer) => gamePlayer.userId !== player.userId
      )!.userId,
      currentPlayerTimeout: this.currentTimeoutDate!,
    };

    //check for a winner
    //if there is a winner conclude
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

      gameEventEmitter.emit(GameEventEmitterEvents.INGAME_BROADCAST, {
        id: this.id,
        message: MessageBuilder.makeMove({ id: this.id, move }),
      });

      gameEventEmitter.emit(GameEventEmitterEvents.CONCLUDE, this.id);

      return;
    }

    //check for the move number
    //if the move number fills everthing then draw the match
    if (this.moveCount >= 42) {
      this.results = [
        { playerId: this.players[0].userId, result: GameResultStatus.DRAW },
        { playerId: this.players[1].userId, result: GameResultStatus.DRAW },
      ];

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
