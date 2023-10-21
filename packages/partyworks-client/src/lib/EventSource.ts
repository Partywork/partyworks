import { v4 as uuid } from "uuid";

type EventsMap<T> = Record<
  keyof T,
  Array<{
    exec: (val: Readonly<any>) => void | Promise<void>;
    id: string;
  }>
>;

//ok during development is somehow shrunk into just a listener, lol sorry you were supposed to be fairly big,
//pub/sub features. basic ones are, emit, on & off.     others are not necessary idk :/ maybe emitAWAIT can still come in handy dunno :/
export class PartyWorksEventSource<T extends Record<string, object>> {
  protected events: EventsMap<T> = {} as EventsMap<T>;

  on<K extends keyof T, V extends T[K]>(
    event: K,
    cb: (val: Readonly<V>) => void | Promise<void>
  ) {
    const functionId = uuid() as string;
    if (this.events[event]) {
      this.events[event].push({ exec: cb, id: functionId });

      return functionId;
    }
    this.events[event] = [{ exec: cb, id: functionId }];
    return functionId;
  }

  off<K extends keyof T>(event: K, functionId: string) {
    this.events[event] = [
      ...this.events[event].filter(({ id }) => id !== functionId),
    ];
  }
}
