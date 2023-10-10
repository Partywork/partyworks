import { Game, GameResults, Move } from "./types";

export type WsActions =
  | { type: "ROOM_STATE"; payload: { currentGame?: Game } }
  | { type: "SET_CURRENT_GAME"; payload: Game }
  | { type: "GAME_USER_JOINED"; payload: { userId: string; username: string } }
  | { type: "START_GAME"; payload: any }
  | { type: "PLAY_MOVE"; payload: Move }
  | {
      type: "APPLY_MOVE";
      payload: {
        gameState: any; //the new gameState after applying the updates
        moveId: number; //id of the move that was applied
      };
    }
  | { type: "COMPLETE_GAME"; payload: GameResults }
  | { type: "CLOSE_GAME" };
