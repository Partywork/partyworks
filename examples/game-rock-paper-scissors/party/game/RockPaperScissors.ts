import { gameEventEmitter } from "../EventEmitter";
import {
  GameContructorData,
  GameEventEmitterEvents,
  GameResults,
  GameResultStatus,
  GamePlayer as Player,
  TMove,
} from "../types";
import { GameHandler } from "./GameHandler";
import { MessageBuilder } from "../MessageBuilder";

export enum RPSChoices {
  ROCK = "Rock",
  PAPER = "Paper",
  SCISSORS = "Scissors",
}

export interface RPSPlayer {
  userId: string;
  wins: number;
  username: string;
}

interface RPSRound {
  player1Choice: RPSChoices | null;
  player2Choice: RPSChoices | null;
  winner: RPSPlayer | null; // null if it's a tie or round not played yet
}

interface RPSGameState {
  rounds: RPSRound[];
  currentRound: number;
}

const getInitialState = () => {
  const initialState: RPSGameState = {
    rounds: [{ player1Choice: null, player2Choice: null, winner: null }],
    currentRound: 0,
  };

  return initialState;
};

//maybe we can just store the entire move history as the game state but :/
export type RPSMoveData = { move: RPSChoices };

export class RPSGame extends GameHandler<RPSGameState, RPSPlayer, RPSMoveData> {
  protected players: RPSPlayer[] = [];
  protected gameState: RPSGameState = getInitialState();
  protected results?: GameResults | undefined;
  private bestOf = 3;
  private timeAllotedPerRound = 15000;
  private roundInterval = 5000;
  private currentTimeout?: NodeJS.Timeout;
  private currentTimeoutDate?: number;

  constructor({ id, players }: GameContructorData) {
    super(id);
    this.players = this.initPlayers(players);
    this.startTimeout(true);

    //start the timeout to start the timeout
    //this one is for when the game actually starts, like 3,2,1. go
  }

  initPlayers(players: GameContructorData["players"]): RPSPlayer[] {
    return players.map((player) => ({ ...player, wins: 0 }));
  }

  startTimeout(first?: boolean) {
    if (this.currentTimeout) {
      clearTimeout(this.currentTimeout);
    }

    const timeoutInterval = first
      ? this.timeAllotedPerRound
      : this.timeAllotedPerRound + this.roundInterval;

    this.currentTimeout = setTimeout(() => {
      const currentRound = this.gameState.rounds[this.gameState.currentRound];

      // If both players have made their choices, resolve the round
      if (
        currentRound.player1Choice !== null &&
        currentRound.player2Choice !== null
      ) {
        this.resolveRound(currentRound);
      } else {
        this.forfietPlayer(currentRound);
      }
    }, timeoutInterval);
    this.currentTimeoutDate = Date.now() + timeoutInterval - 500; //.5 second is the grace period
  }
  // we need an abilit to broadcase messages form here, or send an event to the controller to do it
  private forfietPlayer(currentRound: RPSRound) {
    //assuming we will send it via an event or something

    if (this.currentTimeout) {
      clearInterval(this.currentTimeout);

      if (
        currentRound.player1Choice === null &&
        currentRound.player2Choice === null
      ) {
        //draw the game to inactivity
        this.results = [
          {
            playerId: this.players[0].userId,
            result: GameResultStatus.INACTIVITY,
          },
          {
            playerId: this.players[1].userId,
            result: GameResultStatus.INACTIVITY,
          },
        ];
      } else if (currentRound.player1Choice === null) {
        //player1 loses to inactivity
        this.results = [
          {
            playerId: this.players[0].userId,
            result: GameResultStatus.INACTIVITY,
          },
          { playerId: this.players[1].userId, result: GameResultStatus.WIN },
        ];
      } else {
        //player2 loses to inactivity
        this.results = [
          { playerId: this.players[0].userId, result: GameResultStatus.WIN },
          {
            playerId: this.players[1].userId,
            result: GameResultStatus.INACTIVITY,
          },
        ];
      }
    }

    gameEventEmitter.emit(GameEventEmitterEvents.CONCLUDE, this.id);
  }

  playMove(move: { moveData: RPSMoveData; player: Player }): void {
    const currentPlayer = this.players.find(
      (p) => p.userId === move.player.userId
    );
    if (!currentPlayer) {
      throw new Error("Player not found");
    }

    const currentRound = this.gameState.rounds[this.gameState.currentRound];

    // Identify player1 and player2 based on current round
    if (currentPlayer.userId === this.players[0].userId) {
      currentRound.player1Choice = move.moveData.move;
    } else if (currentPlayer.userId === this.players[1].userId) {
      currentRound.player2Choice = move.moveData.move;
    } else {
      throw new Error("Invalid player");
    }
  }

  private resolveRound(round: RPSRound): void {
    const player1Choice = round.player1Choice!;
    const player2Choice = round.player2Choice!;
    let roundWinner: RPSPlayer | null = null;

    if (
      (player1Choice === RPSChoices.ROCK &&
        player2Choice === RPSChoices.SCISSORS) ||
      (player1Choice === RPSChoices.PAPER &&
        player2Choice === RPSChoices.ROCK) ||
      (player1Choice === RPSChoices.SCISSORS &&
        player2Choice === RPSChoices.PAPER)
    ) {
      roundWinner = this.players[0]; // Player 1 wins
    } else if (
      (player2Choice === RPSChoices.ROCK &&
        player1Choice === RPSChoices.SCISSORS) ||
      (player2Choice === RPSChoices.PAPER &&
        player1Choice === RPSChoices.ROCK) ||
      (player2Choice === RPSChoices.SCISSORS &&
        player1Choice === RPSChoices.PAPER)
    ) {
      roundWinner = this.players[1]; // Player 2 wins
    }

    if (roundWinner) {
      round.winner = roundWinner;
      roundWinner!.wins++;
    } else {
    }

    this.gameState.currentRound++;

    this.startTimeout();

    const move: TMove = {
      id: this.id,
      moveData: {
        round,
      },
      currentTimeout: this.currentTimeoutDate!,
      nextRoundStartDate: this.currentTimeoutDate! - this.timeAllotedPerRound,
    };

    gameEventEmitter.emit(GameEventEmitterEvents.INGAME_BROADCAST, {
      id: this.id,
      message: MessageBuilder.makeMove({ id: this.id, move }),
    });

    if (roundWinner && roundWinner.wins >= this.bestOf - 1) {
      this.results = [
        { playerId: roundWinner.userId, result: GameResultStatus.WIN },
        {
          playerId: this.players.find(
            (player) => player.userId !== roundWinner!.userId
          )!.userId,
          result: GameResultStatus.LOST,
        },
      ];

      gameEventEmitter.emit(GameEventEmitterEvents.CONCLUDE, this.id);
      //we want to finish here
      // Implement logic to determine overall game winner if needed
    } else {
      // Start a new round if not all rounds played yet

      this.gameState.rounds.push({
        player1Choice: null,
        player2Choice: null,
        winner: null,
      });
    }
  }

  resignGame(playerId: string): void {
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

  getState(): {
    [key: string]: any;
    id: string;
    players: RPSPlayer[];
    gameState: RPSGameState;
    results?: GameResults | undefined;
  } {
    return {
      id: this.id,
      players: this.players,
      gameState: this.gameState,
      results: this.results,
      currentTimeout: this.currentTimeoutDate!,
    };
  }

  getResults(): GameResults | undefined {
    return this.results;
  }
}
