function compareArrays(arr1: unknown[], arr2: unknown[]): boolean {
  if (arr1.length !== arr2.length) {
    return false;
  }

  for (let i = 0; i < arr1.length; i++) {
    // const val1 = arr1[i];
    // const val2 = arr2[i];
    // if (
    //   (typeof val1 === "object" && val1 !== null) ||
    //   (typeof val2 === "object" && val2 !== null)
    // ) {
    //   return compareObjects(val1, val2);
    // }

    if (!Object.is(arr1[i], arr2[i])) {
      return false;
    }
  }

  return true;
}

function compareObjects<T, U>(objA: T, objB: U): boolean {
  if (
    typeof objA !== "object" ||
    objA === null ||
    typeof objB !== "object" ||
    objB === null
  ) {
    return false;
  }

  const keysA = Object.keys(objA) as (keyof T)[];
  const keysB = Object.keys(objB) as (keyof U)[];

  if (keysA.length !== keysB.length) {
    return false;
  }

  for (const key of keysA) {
    if (
      !keysB.includes(key as unknown as keyof U) ||
      !Object.is(objA[key], objB[key as unknown as keyof U])
    ) {
      return false;
    }
  }

  return true;
}

export function shallowEqual(value1: unknown, value2: unknown): boolean {
  if (Object.is(value1, value2)) {
    return true;
  }

  const isArray1 = Array.isArray(value1);
  const isArray2 = Array.isArray(value2);

  //if any of em is array
  if (isArray1 || isArray2) {
    //if both of em are not arrays
    if (!isArray1 || !isArray2) {
      return false;
    }

    //compare
    return compareArrays(value1, value2);
  }

  //compare objects
  return compareObjects(value1, value2);
}
