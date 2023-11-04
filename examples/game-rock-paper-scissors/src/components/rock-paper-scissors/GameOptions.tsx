import { GameAssets } from "../../constants";
import styles from "./RPS.module.css";
import { RPSChoices, RPSInternalGameTransitiion } from "./types";
import classNames from "classnames";

interface GameOptionsProps {
  selectedOption?: RPSChoices;
  handleOptionSelect: (choices: RPSChoices) => void;
  gameTransition: RPSInternalGameTransitiion;
}

export const GameOptions: React.FC<GameOptionsProps> = ({
  selectedOption,
  handleOptionSelect,
  gameTransition,
}) => {
  return (
    <div className={styles.options}>
      <button
        disabled={gameTransition === RPSInternalGameTransitiion.NextRound}
        className={classNames(styles.option, {
          [styles.optionSelected]: selectedOption === RPSChoices.PAPER,
        })}
        onClick={() => handleOptionSelect(RPSChoices.PAPER)}
      >
        <img
          className={styles.optionIcon}
          src={GameAssets.paperMiniImageUrl}
          alt="paper hand image"
        />
      </button>
      <button
        disabled={gameTransition === RPSInternalGameTransitiion.NextRound}
        className={classNames(styles.option, {
          [styles.optionSelected]: selectedOption === RPSChoices.SCISSORS,
        })}
        onClick={() => handleOptionSelect(RPSChoices.SCISSORS)}
      >
        <img
          className={styles.optionIcon}
          src={GameAssets.scissorsMiniImageUrl}
          alt="scissors hand image"
        />
      </button>
      <button
        disabled={gameTransition === RPSInternalGameTransitiion.NextRound}
        className={classNames(styles.option, {
          [styles.optionSelected]: selectedOption === RPSChoices.ROCK,
        })}
        onClick={() => handleOptionSelect(RPSChoices.ROCK)}
      >
        <img
          className={styles.optionIcon}
          src={GameAssets.rockMiniImageUrl}
          alt="rock hand image"
        />
      </button>
    </div>
  );
};
