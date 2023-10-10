import { TicTacToeGame } from "./funrooms";

export interface Player {
  id: string;
  data: {
    name: string;
  };
}

//event codes used by client to server
export enum ClientEvents {
  CREATE_GAME = 700,
  START_GAME = 701,

  JOIN_GAME = 710,
  LEAVE_GAME = 711,
  RESIGN_GAME = 712,

  //* Gameplay controller related events
  MAKE_MOVE = 750, //when the player makes thier move
}

export enum EventType {
  //* Connection
  CONNECT = 0, //SERVER ONLY

  //* Presence Types
  USER_JOINED = 1, //whe  a user joins the room
  USER_LEFT = 2, //when a user leaves the room

  //*Broadcast
  BROADCAST = 100, // a message broadcasted by the user

  //* Sending the Room State to the user.
  //* this includes. the empheral/live state like presence. as well as the storage state of the room
  ROOM_STATE = 4, //this is a get message. or a automatic server sent messsage on connection startup

  //* Game related Events

  //*Game controller events
  GAME_CREATED = 700,
  GAME_STARTED = 701,
  GAME_CANCELLED = 702,
  GAME_COMPLETED = 703,
  GAME_DELETED = 704,

  GAME_USER_JOINED = 710,
  GAME_USER_LEFT = 711,
  GAME_USER_RESIGNED = 712,

  //*Gameplay controller related events
  PLAY = 750, // MOVE PLAYED BY THE USER.
}

export interface Move {
  player: {
    userId: string;
  };

  moveData: any; //game specific move data
  currentPlayer: string; //gives the current player whose turn it is
  currentPlayerTimeout: number; //when the inactivity timeout fo the user starts
  moveNumber?: number; //to get a perspective of the move number
  conclude?: boolean; //did this move make you or someone the winner or concludes the game, useful for games like chess, tic-tac-toe, ludo & etc
}

//can it be
interface GameResult {
  playerId: string;
  result: "inactivity" | "resign" | "lost" | "win" | "draw";
}

export type GameResults = GameResult[];
// export interface Game {
// 	players: Player[];
// 	messages: Message[];
// 	status: 'init' | 'waiting' | 'started' | 'ended' | 'forfieted' | 'resigned' | 'cancelled' | 'errored';
// 	type: 'ludo' | 'chess' | 'tic-tac-toe' | 'connect4' | 'rock-papers-scissors';
// 	currentPlayerTimer?: ReturnType<typeof setTimeout>; //so the timer for current player
// 	gameData: {
// 		history: Move[];
// 		state: any; //state depends on games
// 		winners: {
// 			userIds: number[];
// 		};
// 	};
// }
//todo give each game an id
export interface Game {
  id: string;
  gameId: "tic-tac-toe" | "ludo" | "connect4";
  gameStatus: "created" | "started" | "cancelled" | "deleted" | "completed";
  gameState: any; //depends on the game, this state makes up for the entire gameplay.  including joining, timeouts, inactive user kick/forfiet, player turns, gameloop etc.
  createdBy: string; //userId
  players: { userId: string }[]; //for avatar puroposes we will store more info about users, for example the users not currently i the room but still part of the game
  playerRequired: number;

  gameHandler?: TicTacToeGame; //harcoded now for tic-tac-toe
}
