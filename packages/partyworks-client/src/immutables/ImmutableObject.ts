import { mergerPartial } from "partyworks-shared";

//todo, umm... maybe reafactor it a little, with the customCurrent stuff

export class ImmutableObject<
  TBaseObj extends object,
  TTransformObj = TBaseObj
> {
  private cachedObject: TBaseObj | undefined;
  private data: TBaseObj;

  constructor(
    data: TBaseObj,
    private customCurrent: (data: Readonly<TBaseObj>) => TTransformObj = () =>
      this.cachedObject as any
  ) {
    this.data = Object.freeze(data);
  }

  private invalidateCache() {
    this.cachedObject = undefined;
  }

  private _toImmutable(): TBaseObj {
    return this.data;
  }

  get current() {
    if (!this.cachedObject) this.cachedObject = this._toImmutable();

    return this.customCurrent(this.cachedObject);
  }

  get<Key extends keyof TBaseObj>(key: Key): TBaseObj[Key] {
    return this.data[key];
  }

  //sub key level partial updates :/
  partialSet<K extends keyof TBaseObj>(key: K, value: Partial<TBaseObj[K]>) {
    // If the key doesn't exist in the object, create it with the provided value.
    if (!(key in this.data)) {
      const updatedData = { ...this.data, [key]: value } as TBaseObj;
      this.data = Object.freeze(updatedData);
    } else {
      const updatedData = mergerPartial(this.data, {
        [key]: value,
      } as any) as TBaseObj;

      this.data = Object.freeze(updatedData);
    }
    this.invalidateCache();
  }

  set(data: Partial<TBaseObj>) {
    this.data = Object.freeze({ ...this.data, ...data });
    this.invalidateCache();
  }
}
