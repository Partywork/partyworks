import { ConnectionStatus } from "../components/ConnectionStatus";
import { LostConnectionToasts } from "../components/LostConnectionStatus";
import { RoomProvider } from "../partyworks.config";

export default function Home() {
  return (
    <>
      <RoomProvider roomId="funrooms">
        <div
          style={{
            height: "100dvh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <ConnectionStatus />
          <LostConnectionToasts />
        </div>
      </RoomProvider>
    </>
  );
}
