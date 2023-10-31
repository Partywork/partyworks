import { useOthers, useSelf } from "../partyworks.config";

export const Participants = () => {
  const others = useOthers();
  const self = useSelf();

  return (
    <div className="participantsContainer">
      <h2>Participants</h2>
      <div className="participantInfo">
        {self?.info.username} <span className="tag">You</span>
      </div>
      {others.map(({ info, userId, presence }) => {
        return (
          <div className="participantInfo" key={userId}>
            {info?.username!} {info?.bot && <span className="tag">bot</span>}
            {presence?.isTyping && <span>typing...</span>}
          </div>
        );
      })}
    </div>
  );
};
