import { FormEvent, useRef, useState } from "react";
import styles from "./Funrooms.module.css";
import {
  Chat,
  useBroadcastEvent,
  useError,
  useEventListener,
  useMessage,
  useOthers,
  useSelf,
} from "../partyworks.config";
import { Games } from "./Games";
import { useWsActions } from "../action/wsAction";
import { EventType } from "../interface/types";

export const Funrooms = () => {
  const [chats, setChats] = useState<Chat[]>([]);
  const {
    setRoomState,
    setCurrentGame,
    gameUserJoined,
    gameStarted,
    playMove,
    completeGame,
  } = useWsActions();
  const self = useSelf();
  const others = useOthers();
  const broadcastEvent = useBroadcastEvent();
  const [msg, setMessage] = useState("");
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log(self);
    if (msg.length >= 1 && self) {
      broadcastEvent({
        type: "chat",
        data: {
          msg,
          userId: self.info.userId,
          username: self.info.username,
        },
      });

      setChats([...chats, { userId: "-1", msg, username: self.info.username }]);
      setMessage("");
    }
  };

  useError((data) => {
    console.log(`bongo la, bonga cha cha cha`);
    console.log(data);
  });

  useEventListener(({ data }) => {
    if (data.type === "chat") {
      setChats([...chats, data.data]);
    }
  });

  useMessage((e) => {
    const data = e.data;

    const parsedData = JSON.parse(data);

    switch (parsedData.event) {
      case EventType.ROOM_STATE: {
        console.log(`Room State`, parsedData);

        setRoomState(parsedData.data);

        break;
      }

      case EventType.GAME_CREATED: {
        console.log(`Game Created`, parsedData);

        if (parsedData.error) {
          return;
        }

        setCurrentGame(parsedData.data.game);
        break;
      }

      case EventType.GAME_USER_JOINED: {
        console.log(`Game joined by user`, parsedData);

        gameUserJoined(parsedData.data.user);
        break;
      }

      case EventType.GAME_STARTED: {
        console.log(`Game has started`, parsedData);

        gameStarted(parsedData.data);
        break;
      }

      case EventType.PLAY: {
        console.log(`play the game`, parsedData);

        playMove(parsedData.data);
        break;
      }

      case EventType.GAME_COMPLETED: {
        console.log(`Game has been concluded`, parsedData);

        completeGame(parsedData.data);
      }

      default: {
        console.log(`unknown event `, parsedData);
      }
    }
  });

  return (
    <div className={styles.rootContainer}>
      <div className={styles.userSection}>
        <h1>active users</h1>
        <div className={styles.userProfileCard}>
          <div>{self?.info.username} (me)</div>
        </div>

        {others.map((other) => {
          return (
            <div key={other.userId} className={styles.userProfileCard}>
              <div>{other.info.username}</div>
            </div>
          );
        })}
      </div>
      <div className={styles.gameSection}>
        <Games />
      </div>
      <div className={styles.chatSection}>
        <h1>messages</h1>

        <div ref={chatContainerRef} className={styles.chatsContainer}>
          {chats.map(({ msg, userId, username }, index) => {
            return (
              <div key={index.toString()}>
                <h3>{userId === "-1" ? "me" : username}</h3>
                <div>{msg}</div>
              </div>
            );
          })}
        </div>

        <div className={styles.chatInputContainer}>
          <form onSubmit={handleSubmit}>
            <input value={msg} onChange={(e) => setMessage(e.target.value)} />
            <button type="submit">send</button>
          </form>
        </div>
      </div>
    </div>
  );
};
