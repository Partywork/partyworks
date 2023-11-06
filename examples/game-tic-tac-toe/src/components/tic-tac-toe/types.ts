import { GameResults } from "../../types";

export interface TTTPlayer {
  userId: string;
  username: string;
  role: "x" | "o";
}

export interface TTTGameState {
  id: string;
  gameState: ("x" | "o" | null)[];
  players: TTTPlayer[];
  currentPlayer: string;
  results?: GameResults;
  currentTimeoutDate?: number;
}
