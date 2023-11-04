import { RPSGameState, RPSPlayer } from "./types";
import styles from "./RPS.module.css";
import { SettingsDropdown } from "../../components/SettingsDropdown";
import classNames from "classnames";
import { TimeoutBar } from "../utility/TimeoutBar";
import { useSelf } from "../../partyworks.config";
import { getProfileUrl } from "../../utils/getProfileUrl";
import { GameAssets } from "../../constants";

interface GamePlayersProps {
  game: RPSGameState;
}

export const GamePlayers: React.FC<GamePlayersProps> = ({
  game: { players, results, currentTimeout, gameState },
}) => {
  const self = useSelf();

  const renderPlayer = (player: RPSPlayer) => {
    const status = results?.find(
      ({ playerId }) => playerId === player.userId
    )?.result;

    return (
      <div key={player.userId} className={styles.playerContainer}>
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
              src={getProfileUrl(player as any)}
              alt={`Avatar of user`}
            />
          </div>

          <div className={styles.playerInfoCard}>
            {status && (
              <div className={styles.playerTurnContainer}>{status}</div>
            )}

            <div className={styles.playerInfoContainer}>
              <span className={styles.playerInfoUsername}>
                {player.userId === self?.info.userId ? "you" : player.username}
              </span>

              <span className={styles.playeInfoRole}>{player.wins}</span>
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
      playersArray.reverse();
    }

    return playersArray.map((player) => (
      <div key={player.userId}>{renderPlayer(player)}</div>
    ));
  };

  return (
    <div className={styles.playersBox}>
      {!results && currentTimeout && (
        <TimeoutBar
          key={gameState.rounds.length}
          totalTime={15000}
          remainingTime={currentTimeout - Date.now()}
        />
      )}
      <div className={styles.players}>
        {renderPlayers()}
        <div className={styles.settingsDropdown}>
          <SettingsDropdown
            isPlayer={
              !!players.find((player) => player.userId === self?.info.userId)
            }
          />
        </div>
      </div>
    </div>
  );
};
