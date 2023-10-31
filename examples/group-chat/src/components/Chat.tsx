import React from "react";
import { ChatMessage } from "../partyworks.config";
import Linkify from "react-linkify";

interface ChatPropsItf {
  message: ChatMessage;
}

export const Chat: React.FC<ChatPropsItf> = ({ message }) => {
  //render message

  return (
    <>
      <h2>{message.username}</h2>

      <Linkify
        //@ts-ignore
        componentDecorator={(decoratedHref, decoratedText, key) => (
          <a target="blank" href={decoratedHref} key={key}>
            {decoratedText}
          </a>
        )}
      >
        <div>{message.text}</div>
      </Linkify>
    </>
  );
};
