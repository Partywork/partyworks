import { useSearchParams } from "next/navigation";
import React, { useState } from "react";
import { ChatMessage, useUpdateMyPresence } from "../partyworks.config";

interface ChatInputPropsItf {
  sendMessage: (message: ChatMessage) => void;
}

export const ChatInput: React.FC<ChatInputPropsItf> = ({ sendMessage }) => {
  const [message, setMessage] = useState("");
  const params = useSearchParams();

  const updateMyPresence = useUpdateMyPresence();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    sendMessage({ text: message, username: params.get("name")! });
    setMessage("");
  };

  return (
    <>
      <form className="chatInputContainer" onSubmit={handleSubmit}>
        <input
          className="chatInput"
          value={message}
          placeholder="Enter your message, '/bot ' for bot commands"
          onChange={(e) => {
            setMessage(e.target.value), updateMyPresence({ isTyping: true });
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              updateMyPresence({ isTyping: false });
            }
          }}
          onBlur={() => updateMyPresence({ isTyping: false })}
        />
        <button
          className="chatButton"
          disabled={message.length < 1}
          type="submit"
        >
          send
        </button>
      </form>
    </>
  );
};
