import { RPSGameState, RPSInternalGameTransitiion } from "./types";
import styles from "./RPS.module.css";
import HandAnimation from "./HandAnimation";
import { useMemo } from "react";
import Confetti from "react-confetti";
import { useSelf } from "../../partyworks.config";

interface GameRenderProps {
  game: RPSGameState;
  gameTransition: RPSInternalGameTransitiion;
}

const WinConfetti = () => {
  const getRandomShape = () => {
    // Generate a random number between 0 and 1
    const random = Math.random();
    // Return 'circle' if random is less than 0.5, otherwise return 'square'
    return random < 0.5 ? "circle" : "square";
  };
  return (
    <Confetti
      drawShape={(ctx) => {
        const shape = getRandomShape();
        // Customize the confetti shape

        ctx.beginPath();
        if (shape === "circle") {
          // Draw a circle
          const radius = 10; // Set the radius for circles
          ctx.arc(0, 0, radius, 0, Math.PI * 2);
        } else {
          // Draw a square
          const size = 20; // Set the size for squares
          ctx.rect(-size / 2, -size / 2, size, size);
        }

        // ctx.arc(0, 0, 10, 0, Math.PI * 2);
        ctx.fill();
      }}
      className={styles.confettiCanvas}
      initialVelocityY={{ min: 4, max: 10 }}
      numberOfPieces={70}
    />
  );
};

export const GameRender: React.FC<GameRenderProps> = ({
  game,
  gameTransition,
}) => {
  const round = useMemo(() => {
    return game.gameState.rounds[game.gameState.rounds.length - 1];
  }, [game]);

  const self = useSelf();

  const isShuffled = useMemo(() => {
    const isPlaying = game.players.find(
      (player) => player.userId === self?.info.userId
    );

    if (isPlaying && game.players[0].userId !== self?.info.userId)
      return isPlaying;

    return false;
  }, [game, self]);

  const currentRound = useMemo(() => {
    const isPlaying = game.players.find(
      (player) => player.userId === self?.info.userId
    );

    if (isPlaying && game.players[0].userId !== self?.info.userId) {
      const newRound = {
        player1Choice: round.player2Choice,
        player2Choice: round.player1Choice,
        winner: round.winner,
      };
      return newRound;
    }

    return round;
  }, [game, self, round]);

  return (
    <div className={styles.area}>
      <div className={styles.playerArea}>
        {gameTransition === RPSInternalGameTransitiion.NextRound &&
          (isShuffled
            ? game.players[1].userId === currentRound.winner?.userId
            : game.players[0].userId === currentRound.winner?.userId) && (
            <WinConfetti />
          )}

        <HandAnimation
          win={
            gameTransition === RPSInternalGameTransitiion.NextRound &&
            (isShuffled
              ? game.players[1].userId === currentRound.winner?.userId
              : game.players[0].userId === currentRound.winner?.userId)
          }
          selectedOption={currentRound.player1Choice}
        />
      </div>
      <div className={styles.opponentArea}>
        {gameTransition === RPSInternalGameTransitiion.NextRound &&
          (isShuffled
            ? game.players[0].userId === currentRound.winner?.userId
            : game.players[1].userId === currentRound.winner?.userId) && (
            <WinConfetti />
          )}

        <HandAnimation
          win={
            gameTransition === RPSInternalGameTransitiion.NextRound &&
            (isShuffled
              ? game.players[0].userId === currentRound.winner?.userId
              : game.players[1].userId === currentRound.winner?.userId)
          }
          isEnemy={true}
          selectedOption={currentRound.player2Choice}
        />
      </div>
    </div>
  );
};
