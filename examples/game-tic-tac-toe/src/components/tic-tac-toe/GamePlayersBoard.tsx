import classNames from "classnames";
import { GameAssets } from "../../constants";
import { useSelf } from "../../partyworks.config";
import { GameResults } from "../../types";
import { getProfileUrl } from "../../utils/getProfileUrl";
import { SettingsDropdown } from "../SettingsDropdown";
import { TimeoutBar } from "../utility/TimeoutBar";
import styles from "./GamePlayersBoard.module.css";

export interface Player {
  userId: string;
  username: string;
  role: string;
}

export interface GamePlayersProps {
  game: {
    players: Player[];
    results?: GameResults;
    currentPlayer: string;
    currentTimeoutDate?: number;
  };
}

export const GamePlayersBoard: React.FC<GamePlayersProps> = ({
  game: { players, currentPlayer, results, currentTimeoutDate },
}) => {
  const self = useSelf();

  //if is playing always render this guy on right
  //else do the normal that you're doing

  const renderPlayer = (player: Player) => {
    const status = results?.find(
      ({ playerId }) => playerId === player.userId
    )?.result;
    return (
      <div className={styles.playerContainer}>
        {!results && currentPlayer === player.userId && currentTimeoutDate && (
          <TimeoutBar
            totalTime={15000}
            remainingTime={currentTimeoutDate - Date.now()}
          />
        )}

        {!results && (
          <div className={styles.playerTurnContainer}>
            {currentPlayer === player.userId ? "Turn" : "\u00A0"}
          </div>
        )}

        <div className={styles.playerCard}>
          <div className={styles.playerCardImgContainer}>
            {status && status === "win" && (
              <img
                className={styles.crownImage}
                src={GameAssets.crownImageUrl}
                alt="crown"
              />
            )}
            <img
              className={classNames(styles.playerCardImg, {
                [styles.playerCardImgWin]: status === "win",
                [styles.playerCardImgLose]: [
                  "lost",
                  "resign",
                  "inactivity",
                ].includes(status || ""),
              })}
              src={getProfileUrl(player)}
              alt={`Avatar of user`}
            />
          </div>

          <div className={styles.playerInfoCard}>
            {status && (
              <div className={styles.playerTurnContainer}>{status}</div>
            )}

            <div className={styles.playerInfoContainer}>
              <span className={styles.playerInfoUsername}>
                {player.userId === self?.info.userId ? "me" : player.username}
              </span>

              <span className={styles.playeInfoRole}>{player.role}</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderPlayers = () => {
    let playersArray = players;

    // Determine the playing player based on the current player's userId
    const playingPlayer = playersArray.find(
      (player) => player.userId === self?.info.userId
    );

    if (playingPlayer) {
      // Rearrange the array to place the playing player on the right
      playersArray = playersArray.filter(
        (player) => player.userId !== playingPlayer.userId
      );
      playersArray.push(playingPlayer);
    }

    return playersArray.map((player) => (
      <div key={player.userId}>{renderPlayer(player)}</div>
    ));
  };

  return (
    <div className={styles.playersBox}>
      {renderPlayers()}

      <div className={styles.settingsDropdown}>
        <SettingsDropdown
          isPlayer={
            !!players.find((player) => player.userId === self?.info.userId)
          }
        />
      </div>
    </div>
  );
};
