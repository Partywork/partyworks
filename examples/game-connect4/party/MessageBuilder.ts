import { Player } from "partyworks-server";
import { GameController } from "./game/GameController";
import { ServerEvents, Game, Move, TMove } from "./types";

export class MessageBuilder {
  static roomState({ gameController }: { gameController: GameController }) {
    const { game } = gameController.getState();

    return {
      event: ServerEvents.ROOM_STATE,
      data: {
        game,
      },
    };
  }

  static gameCreated({ game }: { game: Game }) {
    return {
      event: ServerEvents.GAME_CREATED,
      data: {
        game,
      },
    };
  }

  static gameJoined({
    id,
    player,
    rid,
  }: {
    id: string;
    player: Player;
    rid?: any;
  }) {
    return {
      event: ServerEvents.GAME_USER_JOINED,
      data: {
        id,
        user: { userId: player.id },
      },
      rid,
    };
  }

  static gameStarted(game: Game) {
    return {
      event: ServerEvents.GAME_STARTED,
      data: {
        id: game.id,
        gameState: game.gameHandler!.getState(),
      },
    };
  }

  static makeMove(moveData: { move: Move | TMove; id: string }) {
    return {
      event: ServerEvents.PLAY,
      data: moveData.move,
    };
  }

  static gameConcluded(game: Game) {
    return {
      event: ServerEvents.GAME_COMPLETED,
      data: game.results,
    };
  }

  static gameDeleted(game: Game) {
    return {
      event: ServerEvents.GAME_DELETED,
      data: {
        id: game.id,
      },
    };
  }
}
