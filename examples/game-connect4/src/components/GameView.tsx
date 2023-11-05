import { Game, GameStatus } from "../types";
import { CreateGame } from "./CreateGame";
import { GameWaiting } from "./GameWaiting";
import { Connect4Game } from "./connect-4/Connect4Game";

interface GameViewProps {
  game?: Game;
}

export const GameView: React.FC<GameViewProps> = ({ game }) => {
  if (!game) return <CreateGame />;

  if (game.gameStatus === GameStatus.CREATED)
    return <GameWaiting game={game} />;

  return <Connect4Game game={game} />;
};
