import { Game, GameStatus } from "../types";
import { CreateGame } from "./CreateGame";
import { GameWaiting } from "./GameWaiting";
import { TicTacToeGame } from "./tic-tac-toe/TicTacToe";

interface GameViewProps {
  game?: Game;
}

export const GameView: React.FC<GameViewProps> = ({ game }) => {
  if (!game) return <CreateGame />;

  if (game.gameStatus === GameStatus.CREATED)
    return <GameWaiting game={game} />;

  return <TicTacToeGame game={game} />;
};
