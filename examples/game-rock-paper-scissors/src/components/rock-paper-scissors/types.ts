import { GameResults } from "../../types";

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

export interface RPSRound {
  player1Choice: RPSChoices | null;
  player2Choice: RPSChoices | null;
  winner: RPSPlayer | null; // null if it's a tie or round not played yet
}

interface RPSInternalGameState {
  rounds: RPSRound[];
  currentRound: number;
}

export interface RPSGameState {
  id: string;
  gameState: RPSInternalGameState;
  players: RPSPlayer[];
  results?: GameResults;
  currentTimeout?: number;
  nextRoundStartDate?: number;
}

export enum RPSInternalGameTransitiion {
  Starting = "starting",
  NextRound = "nextRound",
  CurrentTimeout = "currentTimeout",
}
