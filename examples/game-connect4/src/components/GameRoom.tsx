import { useEffect, useState } from "react";
import { useRoom } from "../partyworks.config";
import { Game, GameStatus, ServerEvents } from "../types";
import { GameView } from "./GameView";
import { soundManager } from "../utils/SoundManager";
import { SoundFilePath } from "../constants";
import styles from "./GameRoom.module.css";
import { Players } from "./Players";

export const GameRoom = () => {
  const room = useRoom();
  const [game, setGame] = useState<Game>();

  useEffect(() => {
    const unsubRoomState = room.on(ServerEvents.ROOM_STATE, ({ game }) => {
      if (game) setGame(game);
    });

    const unsubGameCreated = room.on(ServerEvents.GAME_CREATED, ({ game }) => {
      setGame(game);
    });

    const unsubGameStarted = room.on(
      ServerEvents.GAME_STARTED,
      ({ gameState }) => {
        if (game) {
          setGame({ ...game, gameStatus: GameStatus.STARTED, gameState });
          soundManager.playSoundEffect(SoundFilePath.START);
        }
      }
    );

    const unsubGameDeleted = room.on(ServerEvents.GAME_DELETED, () => {
      setGame(undefined);
    });

    return () => {
      room.off(ServerEvents.ROOM_STATE, unsubRoomState);
      room.off(ServerEvents.GAME_CREATED, unsubGameCreated);
      room.off(ServerEvents.GAME_STARTED, unsubGameStarted);
      room.off(ServerEvents.GAME_DELETED, unsubGameDeleted);
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [room, game]);

  return (
    <div className={styles.rootContainer}>
      <div className={styles.gameViewContainer}>
        <GameView game={game} />
      </div>

      <div className={styles.chatsAndPlayersContainer}>
        <Players />
      </div>
    </div>
  );
};
