import { PARTYWORKS_UNDEFINED_PLACEHOLDER } from "../types";
import { PartyworksParse, PartyworksStringify, mergerPartial } from "../utils";

describe("test Serde", () => {
  const testObjectBasic = {
    data: "read eleceed on webtoon",
    data2: PARTYWORKS_UNDEFINED_PLACEHOLDER,
    data3: undefined,
    data4: null,
    data5: 0,
  };

  const testObjectComplex = {
    data: {
      val1: undefined,
      val2: "hihi",
    },
    data2: [
      undefined,
      PARTYWORKS_UNDEFINED_PLACEHOLDER,
      { val1: undefined, val2: "hihi" },
    ],

    data3: {
      arr1: [undefined, undefined, undefined],
      arr2: [
        {
          val1: {
            val1: [undefined, { val1: "hihi" }, undefined],
          },
        },
      ],
    },
  };

  it("should parse & stringify, exclude undefined", () => {
    const stringifiedObject = PartyworksStringify(
      { ...testObjectBasic },
      { excludeUndefined: true }
    );

    const parsedObject = PartyworksParse(stringifiedObject);

    //this makes sure undefined keys are not kept
    expect(parsedObject).not.toStrictEqual(testObjectBasic);

    //make sure regular JSON.parse & JSON.stringified are used
    expect(parsedObject).toStrictEqual(
      JSON.parse(JSON.stringify(testObjectBasic))
    );
  });

  it("should parse & stringify basic object", () => {
    const stringifiedObject = PartyworksStringify({ ...testObjectBasic });

    const parsedObject = PartyworksParse(stringifiedObject);

    //this makes sure undefined keys are kept
    expect(parsedObject).toStrictEqual(testObjectBasic);
  });

  it("should parse & stringify complex object with nested undefineds", () => {
    const stringifiedObject = PartyworksStringify(
      //deep clone the object
      structuredClone(testObjectComplex)
    );

    const parsedObject = PartyworksParse(stringifiedObject);

    //this makes sure undefined keys are kept
    expect(parsedObject).toStrictEqual(testObjectComplex);
  });
});

describe("test merge Partial", () => {
  it("should merge partial objects when properties are strings and numbers", () => {
    const baseObj = {
      name: "John",
      age: 30,
      city: "New York",
    };

    expect(mergerPartial(baseObj, { age: 32, city: "San Francisco" })).toEqual({
      name: "John",
      age: 32,
      city: "San Francisco",
    });
  });

  it("should merge partial objects with nested structures", () => {
    const baseObj = {
      person: {
        name: "Alice",
        age: 25,
        address: {
          city: "Los Angeles",
          street: "Main St",
        },
      },
      favorites: ["apple", "banana"],
    };

    expect(
      mergerPartial(baseObj as any, {
        person: { age: 28, address: { city: "San Francisco" } },
        favorites: ["strawberry"],
      })
    ).toEqual({
      person: {
        name: "Alice",
        age: 28,
        address: {
          city: "San Francisco",
          street: "Main St",
        },
      },
      favorites: ["strawberry"],
    });
  });

  it("should handle empty partial object", () => {
    const baseObj = {
      name: "Tom",
      age: 40,
      city: "Chicago",
    };

    expect(mergerPartial(baseObj, {})).toEqual({
      name: "Tom",
      age: 40,
      city: "Chicago",
    });
  });

  it("should handle empty base object", () => {
    const baseObj = {};

    expect(mergerPartial(baseObj, { name: "Alice", age: 30 })).toEqual({
      name: "Alice",
      age: 30,
    });
  });

  it("should merge partial objects with null and undefined values", () => {
    const baseObj = {
      name: "David",
      age: 35,
      city: "Seattle",
    };

    expect(
      mergerPartial(baseObj as any, { name: null, city: undefined })
    ).toEqual({
      name: null,
      age: 35,
      city: undefined,
    });
  });

  it("should merge partial objects with arrays", () => {
    const baseObj = {
      fruits: ["apple", "banana", "orange"],
      numbers: [1, 2, 3],
    };

    expect(
      mergerPartial(baseObj, { fruits: ["strawberry"], numbers: [4, 5] })
    ).toEqual({
      fruits: ["strawberry"],
      numbers: [4, 5],
    });
  });

  it("should handle arrays directly overriding", () => {
    const baseObj = {
      fruits: ["apple", "banana", "orange"],
    };

    expect(mergerPartial(baseObj, { fruits: ["strawberry"] })).toEqual({
      fruits: ["strawberry"],
    });
  });

  it("should merge arrays when one is empty", () => {
    const baseObj = {
      numbers: [1, 2, 3],
    };

    expect(mergerPartial(baseObj, { numbers: [] })).toEqual({
      numbers: [],
    });
  });

  it("should handle empty base object with arrays", () => {
    const baseObj = {};

    expect(
      mergerPartial(baseObj, { fruits: ["apple", "banana"], numbers: [1, 2] })
    ).toEqual({
      fruits: ["apple", "banana"],
      numbers: [1, 2],
    });
  });

  it("should merge partial objects with null and undefined arrays", () => {
    const baseObj = {
      colors: ["red", "green"],
    };

    expect(
      mergerPartial(baseObj as any, { colors: null, numbers: undefined })
    ).toEqual({
      colors: null,
      numbers: undefined,
    });
  });
});
