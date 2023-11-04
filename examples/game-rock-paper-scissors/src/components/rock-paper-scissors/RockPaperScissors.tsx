import React, { useEffect, useState } from "react";
import styles from "./RPS.module.css";
import { toast } from "react-toastify";
import { ClientEvents, Game, GameResults, ServerEvents } from "../../types";
import { RPSChoices, RPSGameState, RPSInternalGameTransitiion } from "./types";
import { SoundFilePath } from "../../constants";
import { soundManager } from "../../utils/SoundManager";
import { useRoom } from "../../partyworks.config";
import { GameOptions } from "./GameOptions";
import { GameRender } from "./GameRender";
import { GamePlayers } from "./GamePlayers";
import { CreateGameButton } from "../CreateGame";

interface RockPaperScissorsGameProps {
  game: Game<RPSGameState>;
}

export const RockPaperScissorsGame: React.FC<RockPaperScissorsGameProps> = ({
  game,
}) => {
  const [selectedOption, setSelectedOption] = useState<
    RPSChoices | undefined
  >();

  const room = useRoom();

  const [gameTransitionState, setGameTransitionState] = useState(
    RPSInternalGameTransitiion.Starting
  );

  const [gameCompleted, setGameCompleted] = useState(false);
  const [gameState, setGameState] = useState<RPSGameState>(game.gameState);

  useEffect(() => {
    const cleanupId = room.on(ServerEvents.PLAY, (move) => {
      setSelectedOption(undefined);

      setGameState((gs) => {
        return {
          ...gs,
          gameState: {
            ...gs.gameState,
            rounds: [...gs.gameState.rounds, move.moveData.round],
          },
          players: gs.players.map((player) => {
            if (player.userId === move.moveData.round.winner?.userId) {
              return { ...player, wins: player.wins + 1 };
            }

            return player;
          }),

          currentTimeout: move.currentTimeout,
          nextRoundStartDate: move.nextRoundStartDate,
        };
      });

      transition(move.nextRoundStartDate);
    });

    const unsubscribe = room.on(ServerEvents.GAME_COMPLETED, (results) => {
      soundManager.playSoundEffect(SoundFilePath.CONCLUSION);
      completeGame(results);
    });

    return () => {
      room.off(ServerEvents.PLAY, cleanupId);
      room.off(ServerEvents.GAME_COMPLETED, unsubscribe);
    };
  }, [room, game.id]);

  const transition = (nextRoundStartDate: number) => {
    setGameTransitionState(RPSInternalGameTransitiion.NextRound);

    const interval = setInterval(() => {
      const currentTime = Date.now();

      const remainingTime = Math.max(0, nextRoundStartDate! - currentTime);

      if (remainingTime <= 0) {
        clearInterval(interval);
        setGameTransitionState(RPSInternalGameTransitiion.CurrentTimeout);
        setSelectedOption(undefined);

        setGameState((gs) => {
          return {
            ...gs,
            gameState: {
              ...gs.gameState,
              rounds: [
                ...gs.gameState.rounds,
                { player1Choice: null, player2Choice: null, winner: null },
              ],
            },
          };
        });
      }
    }, 1000);
  };

  const handleOptionSelect = (option: RPSChoices) => {
    setSelectedOption(option);
    sendMove(option);
  };
  //we're just using this to show  errors if they happen
  const sendMove = async (option: RPSChoices) => {
    try {
      await room.emitAwait({
        event: ClientEvents.MAKE_MOVE,
        data: {
          move: option,
        },
      });
    } catch (error: any) {
      if (error.status) {
        toast(error.message as string, {
          autoClose: 2000,
          type: "error",
        });
      }
      //we're okay here with timeouts, or maybe we need async/await confirmation :/
      console.log(error);
    }
  };

  //todo make .on data not readOnly
  const completeGame = async (results: Readonly<GameResults>) => {
    const res = [...results];
    setGameCompleted(true);
    setGameState((currentState) => {
      return {
        ...currentState,
        results: res,
      };
    });
  };

  return (
    <div className={styles.gameRootContainer}>
      {gameCompleted && <CreateGameButton title="start new game" />}

      <div className={styles.gameContainer}>
        <GameRender gameTransition={gameTransitionState} game={gameState} />
        <div className={styles.overlay}>
          <div className={styles.gamePlayers}>
            <GamePlayers game={gameState} />
          </div>

          {gameTransitionState === RPSInternalGameTransitiion.NextRound &&
            gameState.gameState.rounds[gameState.gameState.rounds.length - 1]
              .winner === null && (
              <div className={styles.roundInfo}>
                <h1>DRAW</h1>
              </div>
            )}

          <GameOptions
            gameTransition={gameTransitionState}
            selectedOption={selectedOption}
            handleOptionSelect={handleOptionSelect}
          />
        </div>
      </div>
    </div>
  );
};
