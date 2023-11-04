import React, { useState } from "react";
import { toast } from "react-toastify";
import classNames from "classnames";
import { ClientEvents } from "../types";
import { useRoom } from "../partyworks.config";

interface JoinGameButtonProps {
  buttonTitle?: string;
}

export const JoinGameButton: React.FC<JoinGameButtonProps> = ({
  buttonTitle,
}) => {
  const room = useRoom();
  const [loading, setLoading] = useState(false);

  const JoinGame = async () => {
    if (loading) return;

    try {
      setLoading(true);
      await room.emitAwait({
        event: ClientEvents.JOIN_GAME,
        data: undefined,
      });

      //   naviagteToGame(id);
    } catch (error: any) {
      if (error.status) {
        toast(error.message as string, {
          autoClose: 2000,
          type: "error",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        className={classNames("button-base button-primary")}
        disabled={loading}
        onClick={JoinGame}
      >
        {buttonTitle ? buttonTitle : "Join"}
      </button>
    </>
  );
};
