import { RoomProvider } from "../partyworks.config";
import { useSearchParams } from "next/navigation";
import { ChatBox } from "../components/ChatBox";

export default function Room() {
  const params = useSearchParams();

  if (!params.has("roomId")) return <>Roomid is required</>;
  if (!params.has("name")) return <>Name is required</>;

  return (
    <RoomProvider
      roomId={params.get("roomId")!}
      initialPresence={{ isTyping: false }}
    >
      <ChatBox />
    </RoomProvider>
  );
}
