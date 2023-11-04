import React, { useState } from "react";
import { toast } from "react-toastify";
import classNames from "classnames";
import { ClientEvents } from "../types";
import { useRoom } from "../partyworks.config";

export const DeleteGameButton = () => {
  const room = useRoom();

  const [loading, setLoading] = useState(false);

  const deleteGame = async () => {
    if (loading) return;

    try {
      setLoading(true);
      await room.emitAwait({
        event: ClientEvents.DELETE_GAME,
        data: undefined,
      });
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
        className={classNames("button-base button-danger")}
        disabled={loading}
        onClick={deleteGame}
      >
        delete
      </button>
    </>
  );
};
