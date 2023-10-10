import { Game, GameResults, Move } from "../interface/types";
import { useWsStore } from "../stores/useWsStore";

//todo leaving here, refactor for it to work with wsAPP, & CONTEXT  with an option of socketClass events lib. and proper connection handling this time on.
export const useWsActions = () => {
  const [_, dispatch] = useWsStore();

  const setRoomState = ({ currentGame }: { currentGame: Game }) => {
    dispatch({ type: "ROOM_STATE", payload: { currentGame } });
  };

  const setCurrentGame = (game: Game) => {
    dispatch({ type: "SET_CURRENT_GAME", payload: game });
  };

  const gameUserJoined = (player: { userId: string; username: string }) => {
    dispatch({ type: "GAME_USER_JOINED", payload: player });
  };

  const gameStarted = (gameState: any) => {
    dispatch({ type: "START_GAME", payload: gameState });
  };

  const playMove = (move: Move) => {
    dispatch({ type: "PLAY_MOVE", payload: move });
  };

  const applyMove = (gameState: any, moveId: number) => {
    dispatch({
      type: "APPLY_MOVE",
      payload: {
        gameState,
        moveId,
      },
    });
  };

  const completeGame = (results: GameResults) => {
    dispatch({
      type: "COMPLETE_GAME",
      payload: results,
    });
  };

  const closeGame = () => {
    dispatch({ type: "CLOSE_GAME" });
  };

  return {
    setRoomState,
    setCurrentGame,
    gameUserJoined,
    gameStarted,
    playMove,
    applyMove,
    completeGame,
    closeGame,
  };
};
