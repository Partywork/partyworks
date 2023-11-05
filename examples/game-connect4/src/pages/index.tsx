import { GameRoom } from "../components/GameRoom";
import { RoomProvider } from "../partyworks.config";

export default function Home() {
  return (
    <RoomProvider roomId="partyworks">
      <GameRoom />
    </RoomProvider>
  );
}
