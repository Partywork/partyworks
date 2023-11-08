import { PARTYWORKS_UNDEFINED_PLACEHOLDER } from "../types";
import { PartyworksParse, PartyworksStringify } from "../utils";

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

describe("test Serde", () => {
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

    console.log(parsedObject);
    console.log(testObjectComplex);
    //this makes sure undefined keys are kept
    expect(parsedObject).toStrictEqual(testObjectComplex);
  });
});
