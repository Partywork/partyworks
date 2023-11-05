import { GameResults } from "../../types";

export enum ConnectFourCellState {
  Empty = "",
  Blue = "X", // 'X' for Player 1
  Red = "O", // 'O' for Player 2
}

export type Connect4Player = {
  userId: string;
  username: string;
  role: ConnectFourCellState;
};
export type Connect4InternalGameState = ConnectFourCellState[][];

export interface Connect4GameState {
  id: string;
  gameState: Connect4InternalGameState;
  players: Connect4Player[];
  results?: GameResults;
  currentPlayer: string;
  currentTimeoutDate?: number;
}

export type Connect4MoveData = { rowIndex: number; cellIndex: number };

export const Connect4BoardRows = 7;
export const Connect4BoardColumns = 6;
