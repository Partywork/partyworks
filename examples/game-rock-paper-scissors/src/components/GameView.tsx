import { Game, GameStatus } from "../types";
import { CreateGame } from "./CreateGame";
import { GameWaiting } from "./GameWaiting";
import { RockPaperScissorsGame } from "./rock-paper-scissors/RockPaperScissors";

interface GameViewProps {
  game?: Game;
}

export const GameView: React.FC<GameViewProps> = ({ game }) => {
  if (!game) return <CreateGame />;

  if (game.gameStatus === GameStatus.CREATED)
    return <GameWaiting game={game} />;

  return <RockPaperScissorsGame game={game} />;
};
