import { ImmutablePeers } from "../ImmutableOthers";

describe("test Immutable Others", () => {
  it("should work", () => {
    const others = new ImmutablePeers();

    expect(others.current).toStrictEqual([]);
  });

  it("should add peer", () => {
    const others = new ImmutablePeers();

    others.addPeer({ userId: "1", info: {} });

    expect(others.current).toStrictEqual([{ userId: "1", info: {} }]);
  });

  it("should update peer", () => {
    const others = new ImmutablePeers();

    others.addPeer({ userId: "1", info: {} });
    others.updatePeer("1", { info: { data: 1 }, presence: 2 });

    expect(others.current).toStrictEqual([
      { userId: "1", info: { data: 1 }, presence: 2 },
    ]);
  });

  it("should add bulk peers", () => {
    const others = new ImmutablePeers();

    others.addPeers([
      { userId: "1", info: {} },
      { userId: "2", info: {} },
      { userId: "3", info: {} },
      { userId: "4", info: {} },
    ]);

    expect(others.current).toStrictEqual([
      { userId: "1", info: {} },
      { userId: "2", info: {} },
      { userId: "3", info: {} },
      { userId: "4", info: {} },
    ]);
  });

  it("should update peer 2", () => {
    const others = new ImmutablePeers();

    others.addPeers([
      { userId: "1", info: {} },
      { userId: "2", info: {} },
      { userId: "3", info: {} },
      { userId: "4", info: {} },
    ]);

    others.updatePeer("2", { info: { data: 1 } });
    expect(others.current).toStrictEqual([
      { userId: "1", info: {} },
      { userId: "2", info: { data: 1 } },
      { userId: "3", info: {} },
      { userId: "4", info: {} },
    ]);
  });

  it("should remove peer", () => {
    const others = new ImmutablePeers();

    others.addPeers([
      { userId: "1", info: {} },
      { userId: "2", info: {} },
      { userId: "3", info: {} },
      { userId: "4", info: {} },
    ]);

    others.disconnectPeer("2");

    expect(others.current).toStrictEqual([
      { userId: "1", info: {} },
      { userId: "3", info: {} },
      { userId: "4", info: {} },
    ]);
  });

  it("should not remove peer", () => {
    const others = new ImmutablePeers();

    others.addPeers([
      { userId: "1", info: {} },
      { userId: "2", info: {} },
      { userId: "3", info: {} },
      { userId: "4", info: {} },
    ]);

    others.disconnectPeer("na");

    expect(others.current).toStrictEqual([
      { userId: "1", info: {} },
      { userId: "2", info: {} },
      { userId: "3", info: {} },
      { userId: "4", info: {} },
    ]);
  });

  it("equality", () => {
    const others = new ImmutablePeers();

    const ref1 = others.current;
    const ref2 = others.current;

    expect(ref1).toBe(ref2);

    others.addPeers([
      { userId: "1", info: {} },
      { userId: "2", info: {} },
      { userId: "3", info: {} },
      { userId: "4", info: {} },
    ]);

    const ref3 = others.current;
    const ref4 = others.current;

    expect(ref3).not.toBe(ref2);
    expect(ref3).toBe(ref4);

    //noop
    others.disconnectPeer("na");

    const ref5 = others.current;
    const ref6 = others.current;

    expect(ref4).toBe(ref5);
    expect(ref5).toBe(ref6);

    others.disconnectPeer("1");

    const ref7 = others.current;
    const ref8 = others.current;

    expect(ref6).not.toBe(ref7);
    expect(ref7).toBe(ref8);

    //noop
    others.updatePeer("na", { info: { newData: "none" } });

    const ref9 = others.current;
    const ref10 = others.current;

    expect(ref8).toBe(ref9);
    expect(ref9).toBe(ref10);

    others.updatePeer("2", { info: { newData: "none" } });

    const ref11 = others.current;
    const ref12 = others.current;

    expect(ref10).not.toBe(ref11);
    expect(ref11).toBe(ref12);
  });
});
