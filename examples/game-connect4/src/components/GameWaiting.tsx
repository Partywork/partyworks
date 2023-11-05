import styles from "./GameWaiting.module.css";
import React, { useMemo } from "react";
import { Game } from "../types";
import { useSelf } from "../partyworks.config";
import { GameAssets } from "../constants";
import { JoinGameButton } from "./JoinGame";
import { DeleteGameButton } from "./DeleteGame";
import { getProfileUrl } from "../utils/getProfileUrl";

interface GameWaitingProps {
  game: Game;
}

export const GameWaiting: React.FC<GameWaitingProps> = ({ game }) => {
  //this should always be available at this point of time
  const self = useSelf();

  const hasJoined = useMemo(() => {
    return (
      game.players.findIndex(({ userId }) => userId === self!.info.userId) !==
      -1
    );
  }, [game, self]);

  return (
    <div className={styles.rootContainer}>
      <h1 className={styles.title}>Waiting for players...</h1>

      <div className={styles.waitingCard}>
        <div className={styles.waitingCardTopContainer}>
          <div>
            <img
              className={styles.gameLogo}
              src={GameAssets.imageUrl}
              alt="logo of game"
            />
          </div>
          <div className={styles.cardInfo}>
            <h2 className={styles.gameTitle}>{GameAssets.displayName}</h2>
            <div className={styles.playersContainer}>
              {game.players.map((player) => {
                return (
                  <img
                    key={player.userId}
                    className={styles.playerImg}
                    src={getProfileUrl(player)}
                    width={50}
                    height={50}
                    alt={`Avatar of user`}
                  />
                );
              })}
            </div>
          </div>
        </div>

        {!hasJoined && <JoinGameButton />}

        {game.createdBy.userId === self?.info.userId && <DeleteGameButton />}
      </div>
    </div>
  );
};
