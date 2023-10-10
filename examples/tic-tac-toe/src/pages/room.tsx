import { useSearchParams } from "next/navigation";
import { RoomProvider } from "../partyworks.config";
import { Funrooms } from "../components/Funrooms";
import { WsCtxProvider } from "../stores/useWsStore";

export default function FunroomsTic() {
  const params = useSearchParams();

  if (!params.has("roomId")) return <>Roomid is required</>;
  return (
    <RoomProvider roomId={params.get("roomId")!}>
      <WsCtxProvider>
        <Funrooms />
      </WsCtxProvider>
    </RoomProvider>
  );
}
