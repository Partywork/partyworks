//event codes used by client to server
export enum ClientEvents {
  //* Game releated events
  CREATE_GAME = 700, //this event creates a new game, based on the gameId which can be any supported game
  START_GAME = 701, //this event starts the game, manually, can be used for games where players can start manulally for example, aftera minimum required number or users has joined
  DELETE_GAME = 702, //this event deleted an not yet started game, which has created status
  JOIN_GAME = 710, //this event is for joining a already created game
  LEAVE_GAME = 711, //this event is for leaving an already joined game which has not yet started
  RESIGN_GAME = 712, //this event is for resiging an already started game

  //* Gameplay controller related events
  MAKE_MOVE = 750, //when the player makes their move
}
//event codes sent by server to client
export enum ServerEvents {
  //* Sending the Room State to the user.
  //* this includes. the empheral/live state like presence. as well as the storage state of the room
  ROOM_STATE = 4, //this is a get message. or a automatic server sent messsage on connection startup
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

export enum GameStatus {
  CREATED = "created", //when the game is created, and player can join
  STARTED = "started", //when the game is started/ongoing and players are currently playing
  COMPLETED = "completed", //when the game is completed & results are set
  CANCELLED = "cancelled", //when th game did not have enough players after it's creation after the timeout, let's say 10min. it'll get cancelled
  DELETED = "deleted", //when the game is deleted manually by the creator, author(of the room). this can only be done for games with status 'created'
}

interface GameResult {
  playerId: string;
  result: "inactivity" | "resign" | "lost" | "win" | "draw";
}

export type GameResults = GameResult[];

export interface Player {
  userId: string;
  username: string;
}

export interface BaseGame {
  id: string;
  gameId: "tic-tac-toe";
  gameStatus: GameStatus;
  createdBy: { userId: string };
  players: Player[];
  minPlayersRequired: number;
  maxPlayersLimit: number;
  results?: GameResults;
}

export interface Game<T = any> extends BaseGame {
  gameState: T; //depends on the game, this state makes up for the entire gameplay.  including joining, timeouts, inactive user kick/forfiet, player turns, gameloop etc.
}

export interface Move<T = any> {
  id: string; //id of the game
  player: {
    userId: string;
  };
  moveData: T; //game specific move data
  currentPlayer: string; //gives the current player whose turn it is
  currentPlayerTimeout?: number; //when the inactivity timeout fo the user starts
  moveNumber?: number; //to get a perspective of the move number
  conclude?: boolean; //did this move make you or someone the winner or concludes the game, useful for games like chess, tic-tac-toe, ludo & etc
}

export type TicTacToeMoveData = { index: number };
