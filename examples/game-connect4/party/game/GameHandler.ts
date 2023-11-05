import { GameResults, GamePlayer as Player } from "../types";

export abstract class GameHandler<
  GameState = any,
  GamePlayer = any,
  MoveData = any
> {
  protected id: string;
  protected abstract players: GamePlayer[];
  protected abstract results?: GameResults;
  protected abstract gameState: GameState;

  constructor(id: string) {
    this.id = id;
  }

  abstract playMove(move: { moveData: MoveData; player: Player }): void;
  abstract resignGame(playerId: string): void;

  abstract getState(): {
    id: string;
    players: GamePlayer[];
    gameState: GameState;
    results?: GameResults;
    [key: string]: any;
  };

  getResults() {
    return this.results;
  }
}
