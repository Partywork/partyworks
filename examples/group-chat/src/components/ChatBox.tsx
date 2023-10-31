import { useState } from "react";
import {
  ChatMessage,
  useBroadcastEvent,
  useEventListener,
  useRoom,
} from "../partyworks.config";
import { ChatInput } from "./ChatInput";
import { Chats } from "./Chats";
import { Participants } from "./Participants";
import { TypingIndicator } from "./TypingIndicator";

export const ChatBox = () => {
  const room = useRoom();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const broadcast = useBroadcastEvent();

  // console.log(others);

  //listen for new messages
  useEventListener(({ userId, data: event }) => {
    switch (event.type) {
      case "message": {
        setMessages([...messages, event.data]);
        break;
      }

      default: {
        console.warn(`[${userId}] unknown event `, event);
      }
    }
  });

  const sendMessage = (message: ChatMessage) => {
    setMessages([...messages, message]);
    broadcast({
      type: "message",
      data: message,
    });
  };

  return (
    <div className="chatBoxContainer">
      <div className="chatAndParticipantsContainer">
        <div className="chatsDisplayContainer">
          <h2 className="roomTitle">Room - {room.id}</h2>
          <Chats messages={messages} />
        </div>

        <Participants />
      </div>

      <TypingIndicator />
      <ChatInput sendMessage={sendMessage} />
    </div>
  );
};
