import { useOthers } from "../partyworks.config";

export const TypingIndicator = () => {
  const someoneIsTyping = useOthers((others) => {
    return others.some((other) => other.presence?.isTyping);
  });

  return (
    <div className="someone_is_typing">
      {someoneIsTyping ? "Someone is typing..." : "\u00A0"}
    </div>
  );
};
