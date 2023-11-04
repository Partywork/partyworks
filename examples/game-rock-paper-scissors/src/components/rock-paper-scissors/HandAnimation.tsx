import classNames from "classnames";
import React from "react";
import styles from "./RPS.module.css"; // Import the module CSS file
import { RPSChoices } from "./types";
import { GameAssets } from "../../constants";

interface HandAnimationProps {
  selectedOption?: RPSChoices | null;
  isEnemy?: boolean;
  win?: boolean;
}

const imagesMap = {
  [RPSChoices.PAPER]: {
    imageUrL: GameAssets.paperImageUrl,
  },

  [RPSChoices.ROCK]: {
    imageUrL: GameAssets.rockImageUrl,
  },

  [RPSChoices.SCISSORS]: {
    imageUrL: GameAssets.scissorsImageUrl,
  },
};

const HandAnimation: React.FC<HandAnimationProps> = ({
  selectedOption,
  isEnemy,
  win,
}) => {
  return (
    <div>
      <div role="img" aria-label="hand-emoji">
        <img
          className={classNames(styles.baseHand, {
            [styles.hand]: !isEnemy,
            [styles.handEnemy]: isEnemy,
            [styles.winAnimation]: !isEnemy && win,
            [styles.handAnimation]: !isEnemy,
            [styles.winAnimationEnemy]: isEnemy && win,
            [styles.handAnimationEnemy]: isEnemy,
          })}
          src={
            selectedOption
              ? imagesMap[selectedOption].imageUrL
              : imagesMap[RPSChoices.ROCK].imageUrL
          }
          alt="rel"
        />
      </div>
    </div>
  );
};

export default HandAnimation;
