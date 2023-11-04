import styles from "./GameWaiting.module.css";
import React from "react";
import { useRoom } from "../partyworks.config";
import { GameAssets } from "../constants";
import { ClientEvents } from "../types";
import classNames from "classnames";

interface CreateGameButtonProps {
  title?: string;
}

export const CreateGameButton: React.FC<CreateGameButtonProps> = ({
  title,
}) => {
  const room = useRoom();

  const createGame = async () => {
    room.emit(ClientEvents.CREATE_GAME, undefined);
  };

  return (
    <>
      <button
        className={classNames("button-base button-primary")}
        onClick={createGame}
      >
        {title ?? "Create Game"}
      </button>
    </>
  );
};

export const CreateGame = () => {
  return (
    <div className={styles.rootContainer}>
      <h1 className={styles.title}>Start the game...</h1>

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
              <img
                className={styles.playerImg}
                src={
                  "https://tenor.com/view/cat-vibe-good-vibes-dancing-gif-24047219.gif"
                }
                width={50}
                height={50}
                alt={`Avatar of user`}
              />
            </div>
          </div>
        </div>
        <CreateGameButton />
      </div>
    </div>
  );
};
