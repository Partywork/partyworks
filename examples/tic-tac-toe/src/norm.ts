import { PartyWorksRoom } from "./partyworks/lib/PartyWorksClient";

interface Listener {
  test: { test: number };
  test2: { yeah: "ok" };
}

interface Emitters {
  test: { me: "ok" | "nok" };
  test2: string;
  test3: string;
}

const r = {} as unknown as PartyWorksRoom<any, any, any, Listener, Emitters>;

r.on("test", (data) => {
  console.log(data.test);
});

r.emit("test", { me: "nok" });
const res = r.emitAwait({ event: "test2", data: "dw" });
