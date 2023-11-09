import { ImmutableObject } from "../ImmutableObject";

describe("test Immutable Object", () => {
  it("should work", () => {
    const obj = new ImmutableObject({ test: "data", val: 0 });

    expect(obj.current).toStrictEqual({ test: "data", val: 0 });
  });

  it("partial set", () => {
    const obj = new ImmutableObject<any>({ test: "data", val: 0 });

    obj.partialSet("none", undefined!);

    expect(obj.current).toStrictEqual({
      test: "data",
      val: 0,
      none: undefined,
    });
  });

  it("partial set2", () => {
    const obj = new ImmutableObject<any>({ test: "data", val: 0 });

    obj.partialSet("none", undefined!);

    //@ts-ignore
    obj.partialSet("val", 1);

    expect(obj.current).toStrictEqual({
      test: "data",
      val: 1,
      none: undefined,
    });
  });

  it("[current] partial set3", () => {
    const obj = new ImmutableObject<any>({
      test: "data",
      val: 0,
      arr: ["p", "a", "r", "t", "y"],
    });

    obj.partialSet("arr", ["w", "o", "r", "k", "s"]);

    expect(obj.current).toStrictEqual({
      test: "data",
      val: 0,
      arr: ["w", "o", "r", "k", "s"],
    });
  });

  it("partial set4", () => {
    const obj = new ImmutableObject<any>({
      test: "data",
      val: 0,
      arr: ["p", "a", "r", "t", "y"],
      obj: { val1: "val1", val2: "val2" },
    });

    obj.partialSet("obj", { val2: "new", val3: "new" });

    expect(obj.current).toStrictEqual({
      test: "data",
      val: 0,
      arr: ["p", "a", "r", "t", "y"],
      obj: { val1: "val1", val2: "new", val3: "new" },
    });
  });

  it("partial set5", () => {
    const obj = new ImmutableObject<any>({
      data: { id: "bdd4adaa-0251-4809-9c0b-9c47b164adab" },
      info: { color: "#FFF176" },
      presence: { cursor: undefined },
    });

    obj.partialSet("presence", { cursor: { x: 10, y: 10 } });

    expect(obj.current).toStrictEqual({
      data: { id: "bdd4adaa-0251-4809-9c0b-9c47b164adab" },
      info: { color: "#FFF176" },
      presence: { cursor: { x: 10, y: 10 } },
    });
  });

  it("set 1", () => {
    const obj = new ImmutableObject<any>({
      test: "data",
      val: 0,
      arr: ["p", "a", "r", "t", "y"],
      obj: { val1: "val1", val2: "val2" },
    });

    obj.set({ arr: "bob", obj: { newObj: "hey hey hey" }, newVal: true });

    expect(obj.current).toStrictEqual({
      test: "data",
      val: 0,
      arr: "bob",
      obj: { newObj: "hey hey hey" },
      newVal: true,
    });
  });

  it("set 2", () => {
    const obj = new ImmutableObject<any>({
      test: "data",
      val: 0,
      arr: ["p", "a", "r", "t", "y"],
      obj: { val1: "val1", val2: "val2" },
    });

    obj.set({ newVal: true });

    expect(obj.current).toStrictEqual({
      test: "data",
      val: 0,
      arr: ["p", "a", "r", "t", "y"],
      obj: { val1: "val1", val2: "val2" },
      newVal: true,
    });
  });

  it("equality", () => {
    const obj = new ImmutableObject({ test: "data", val: 0 });

    const ref1 = obj.current;
    const ref2 = obj.current;

    expect(ref1).toBe(ref2);

    obj.set({ val: 1 });

    const ref3 = obj.current;
    const ref4 = obj.current;

    expect(ref2).not.toBe(ref3);
    expect(ref3).toBe(ref4);

    const ref5 = obj.current;

    expect(ref5).toBe(ref4);
  });
});
