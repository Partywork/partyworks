import React, { useEffect, useRef } from "react";
import { ChatMessage } from "../partyworks.config";
import { Chat } from "./Chat";

interface ChatsPropsItf {
  messages: ChatMessage[];
}

export const Chats: React.FC<ChatsPropsItf> = ({ messages }) => {
  //render messages

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  };

  return (
    <div ref={containerRef} className="chatsContainer">
      {messages.map((message, i) => (
        <Chat key={i} message={message} />
      ))}
    </div>
  );
};
