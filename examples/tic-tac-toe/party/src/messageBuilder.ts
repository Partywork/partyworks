import { GameController, TicTacToeGame } from "./funrooms";
import { EventType, Game, GameResults, Move, Player } from "./types";

export class MessageBuilder {
  static connect(player: Player) {
    return {
      event: EventType.CONNECT,
      data: {
        userId: player.id,
        username: player.data.name,
      },
    };
  }

  static roomState({
    users,
    gameController,
  }: {
    users: Player[];
    gameController: GameController;
  }) {
    return {
      event: EventType.ROOM_STATE,
      data: {
        users: users.map((player) => ({
          userId: player.id,
          username: player.data.name,
        })),
        currentGame: gameController.getState(),
      },
    };
  }

  static userOnline(player: Player) {
    return {
      event: EventType.USER_JOINED,
      data: {
        userId: player.id,
        username: player.data.name,
      },
    };
  }

  static userOffline(player: Player) {
    return {
      event: EventType.USER_LEFT,
      data: {
        userId: player.id,
      },
    };
  }

  static broadcastMessage(player: Player, msg: string) {
    return {
      event: EventType.BROADCAST,
      data: {
        userId: player.id,
        msg,
      },
    };
  }

  static gameCreated(game: Game) {
    return {
      event: EventType.GAME_CREATED,
      data: {
        game,
      },
    };
  }

  static gameJoined(player: Player) {
    return {
      event: EventType.GAME_USER_JOINED,
      data: {
        user: { userId: player.id },
      },
    };
  }

  static gameStarted(gameHandler: TicTacToeGame) {
    return {
      event: EventType.GAME_STARTED,
      data: {
        gameState: gameHandler.getCurrentState(),
      },
    };
  }

  static makeMove(move: Move) {
    return {
      event: EventType.PLAY,
      data: move,
    };
  }

  static gameCompleted(gameResults: GameResults) {
    return {
      event: EventType.GAME_COMPLETED,
      data: gameResults,
    };
  }
}
