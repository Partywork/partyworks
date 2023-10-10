import { EventEmitter } from "node:events";
import { Game, GameResults, Move, Player } from "./types";

const supportedGames = ["tic-tac-toe", "ludo", "connect4"];
export const gameEventEmitter = new EventEmitter();

export class TicTacToeGame {
  private players: { userId: string; role: "x" | "o"; win: boolean | null }[] =
    [];
  private gameState: ("x" | "o" | null)[] = Array(9).fill(null);
  private currentPlayer: string;
  private moveCount: number;
  private results?: GameResults; //having this means, that the game has been concluded. but having another status is also necessary for cancelled games & stuff
  private timeAllotedPerMove: number = 15000; //15 seconds are allowed per move
  private currentTimeout?: NodeJS.Timeout;
  private currentTimeoutDate?: number;

  constructor(players: { userId: string }[]) {
    this.players = this.shuffleRoles(players);
    this.currentPlayer =
      players[Math.floor(Math.random() * this.players.length)].userId;
    this.moveCount = 0;
    this.startTimeout();
    //*NEXT this is where the game is considered started, so adding a timeout and timeout related data makes sense
  }

  private shuffleRoles(
    players: { userId: string }[]
  ): { userId: string; role: "x" | "o"; win: null }[] {
    const shuffledRoles = ["x", "o"].sort(() => Math.random() - 0.5);
    return players.map((player, index) => ({
      userId: player.userId,
      role: shuffledRoles[index] as "x" | "o",
      win: null,
    }));
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

  private startTimeout = () => {
    if (this.currentTimeout) {
      clearTimeout(this.currentTimeout);
    }
    this.currentTimeout = setTimeout(
      () => this.forfietPlayer(),
      this.timeAllotedPerMove
    );
    this.currentTimeoutDate = Date.now() + this.timeAllotedPerMove - 2000; //2 seconds is the grace period
  };

  // we need an abilit to broadcase messages form here, or send an event to the controller to do it
  private forfietPlayer() {
    //assuming we will send it via an event or something

    if (this.currentTimeout) {
      clearInterval(this.currentTimeout);
    }
    this.results = [
      { playerId: this.currentPlayer, result: "inactivity" },
      {
        playerId: this.players.find(
          (player) => player.userId !== this.currentPlayer
        )!.userId,
        result: "win",
      },
    ];

    gameEventEmitter.emit("conclude");
  }

  getCurrentState() {
    return {
      players: this.players,
      gameState: this.gameState,
      currentPlayer: this.currentPlayer,
      currentTimeoutDate: this.currentTimeoutDate,
    };
  }

  getResults() {
    return this.results;
  }

  //todo lol, add a validation for the current player on the server, dunno  how i missed that one
  //this move changes the game state, so should we send over the state? or just the move?
  makeMove({
    movePlayer,
    moveData,
  }: {
    movePlayer: Player;
    moveData: {
      index: number;
    };
  }): Move | false {
    //todo also validate the move data

    //this is not your turn bruh, hacker
    if (this.currentPlayer !== movePlayer.id || this.results) return false;

    const currentPlayer = this.players.find(
      (player) => player.userId === movePlayer.id
    );
    if (!currentPlayer || this.gameState[moveData.index] !== null) {
      return false; // Invalid move
    }

    this.gameState[moveData.index] = currentPlayer.role;
    this.currentPlayer = this.players.find(
      (player) => player.userId !== movePlayer.id
    )!.userId;
    this.startTimeout();
    this.moveCount++;

    const move = {
      player: {
        userId: movePlayer.id,
      },
      moveData: {
        cellIndex: moveData.index,
      },
      currentPlayer: this.players.find(
        (player) => player.userId !== movePlayer.id
      )!.userId,
      currentPlayerTimeout: this.currentTimeoutDate!,
    };

    if (this.checkWinner(currentPlayer.role)) {
      //maybe handle the win process, send an event? or cleanup ? or somethin dunno :/.
      // Current player wins

      //no need for this now
      this.players.forEach((player) => {
        if (player.role === currentPlayer.role) {
          player.win = true;
          return;
        }

        player.win = false;
      });

      this.results = [
        { playerId: currentPlayer.userId, result: "win" },
        {
          playerId: this.players.find(
            (player) => player.userId !== movePlayer.id
          )!.userId,
          result: "lost",
        },
      ];

      clearTimeout(this.currentTimeout);

      // {
      // 	winners: [currentPlayer.userId],
      // 	notWinners: [this.players.find((player) => player.userId !== movePlayer.id)!.userId],
      // 	draw: [],
      // };

      return {
        ...move,
        conclude: true, //maybe win should send some more info about the state oe let the clients handle it
      };
    }

    //if not a winner and moveCount is 9, conclude the game to be a draw
    if (this.moveCount === 9) {
      //results handles the state of victory, defeat & draw
      //this property also means that the game is concluded

      this.results = [
        { playerId: this.players[0].userId, result: "draw" },
        { playerId: this.players[1].userId, result: "draw" },
      ];

      clearTimeout(this.currentTimeout);

      return {
        ...move,
        conclude: true, //maybe win should send some more info about the state oe let the clients handle it
      };
    }

    return move;
  }
}

//todo add error handling, to easily return custo errors

export class GameController {
  currentGame?: Game;

  createGame(gameId: string, player: Player) {
    //do not let another game while current one is going on

    if (
      this.currentGame?.gameStatus === "created" ||
      this.currentGame?.gameStatus === "started"
    )
      return false;

    if (!supportedGames.includes(gameId)) return false;

    this.currentGame = {
      id: (Math.random() * Math.random() * Math.random()).toString(),
      gameId: gameId as Game["gameId"],
      gameStatus: "created",
      gameState: undefined,
      createdBy: player.id,
      players: [{ userId: player.id }],
      playerRequired: 2,
    };
    return true;
  }

  joinGame(player: Player) {
    if (!this.currentGame) return false;

    //technically this should take care of checking the user/player length for the game
    if (this.currentGame.gameStatus !== "created") return false;
    //add the ability to join
    const hasJoined = this.currentGame.players.find(
      ({ userId }) => userId === player.id
    );

    if (hasJoined) return false;

    this.currentGame.players.push({ userId: player.id });
    return true;
  }

  leaveGame() {
    //add the bility to leave
  }

  resignGame() {}

  //can be manual by the user. or automatic when eough player join for the game
  startGame() {
    //check if required nuumber of players are there

    if (this.currentGame?.gameStatus !== "created") return false;

    if (this.currentGame.playerRequired !== this.currentGame.players.length)
      return false;

    this.currentGame.gameHandler = new TicTacToeGame([
      ...this.currentGame.players,
    ]);
    this.currentGame.gameStatus = "started";
    return true;
  }

  concludeGame() {
    this.currentGame!.gameStatus = "completed";
    // this.currentGame = undefined //? should I keep it till the next game arrives :/
  }

  getState() {
    return { ...this.currentGame, gameState: this.currentGame?.gameHandler };
  }
}
