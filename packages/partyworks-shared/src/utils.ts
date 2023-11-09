import { PARTYWORKS_UNDEFINED_PLACEHOLDER } from "./types";

//TODO move to a better serde

//huh.. not sure if i want this, maybe using explicit null is better. it's kinda hacky it feels

const replaceUndefined = (parsedData: any, placeholderKeys: string[]): any => {
  placeholderKeys.forEach((path: string) => {
    const keys = path.split(".");
    let temp = parsedData;
    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i];
      if (key.includes("[")) {
        const [objKey, index] = key.split("[");
        const indexValue = parseInt(index.replace(/\D/g, ""));
        temp = temp[objKey][indexValue];
      } else {
        temp = temp[key];
      }
    }

    const lastKey = keys[keys.length - 1];
    if (lastKey.includes("[")) {
      const [objKey, index] = lastKey.split("[");
      const indexValue = parseInt(index.replace(/\D/g, ""));
      temp[objKey][indexValue] = undefined;
    } else {
      temp[lastKey] = undefined;
    }
  });
};

export const PartyworksParse = (data: string) => {
  //parse the message, note: reverting the placeholder with undefined in json.parse removes the key
  const parsedData = JSON.parse(data as string);

  //likely a normal json object so just return early
  if (!parsedData || parsedData._pwf !== "0" || !parsedData.meta) {
    return parsedData;
  }

  //replace the undefined placeholder with actual undefined.
  //hmmm... me wondering the performance implications of this X
  //well maybe, jut maybe in fututre we cna have a custom binary protocol :) (devtools support would be necessary to ensure good dx, where the suers can see the incoming/outgoing messages decoded in a object form) (so likely gonna take some time to reach this)
  replaceUndefined(parsedData.data, parsedData.meta);

  return parsedData.data;
};

export const PartyworksStringify = (
  data: any,
  options?: { excludeUndefined?: boolean }
) => {
  const placeholderKeys: string[] = [];

  if (options?.excludeUndefined) return JSON.stringify(data);

  const traverseAndStringify = (obj: any, path = "") => {
    for (const key in obj) {
      const currentPath = path ? `${path}.${key}` : key;
      const value = obj[key];

      if (value === undefined) {
        placeholderKeys.push(currentPath);
        obj[key] = PARTYWORKS_UNDEFINED_PLACEHOLDER;
      } else if (Array.isArray(value)) {
        for (let i = 0; i < value.length; i++) {
          if (value[i] === undefined) {
            const arrayPath = `${currentPath}[${i}]`;
            placeholderKeys.push(arrayPath);
            obj[key][i] = PARTYWORKS_UNDEFINED_PLACEHOLDER;
          } else if (typeof value[i] === "object" && value[i] !== null) {
            traverseAndStringify(value[i], `${currentPath}[${i}]`);
          }
        }
      } else if (typeof value === "object" && value !== null) {
        traverseAndStringify(value, currentPath);
      }
    }
  };

  traverseAndStringify(data);
  return JSON.stringify({ data, meta: placeholderKeys, _pwf: "0" });
};

//partial merge util for presence
export const mergerPartial = <T>(rootObj: T, partialObj: Partial<T>): T => {
  const mergedObject = { ...rootObj };

  const mergeDeep = <T>(target: T, source: Partial<T>): T => {
    for (const key in source) {
      if (Object.prototype.hasOwnProperty.call(source, key)) {
        const rootValue = target[key as keyof T];
        const partialValue = source[key];

        if (
          rootValue &&
          partialValue &&
          typeof rootValue === "object" &&
          typeof partialValue === "object" &&
          !Array.isArray(rootValue)
        ) {
          target[key as keyof T] = mergeDeep(
            rootValue,
            partialValue as Partial<typeof rootValue>
          );
        } else if (Array.isArray(rootValue) && Array.isArray(partialValue)) {
          target[key as keyof T] = partialValue as any as T[Extract<
            keyof T,
            string
          >];
        } else {
          target[key as keyof T] = partialValue as T[Extract<keyof T, string>];
        }
      }
    }
    return target;
  };

  mergeDeep(mergedObject, partialObj);
  return mergedObject as T;
};
