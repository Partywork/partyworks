import { v4 as uuid } from "uuid";

type EventsMap<T> = Record<
  keyof T,
  Array<{
    exec: (val: Readonly<any>) => void | Promise<void>;
    id: string;
  }>
>;

export type Listener<T> = (event: T) => void;
export type UnsubscribeListener = () => void;

//so i believe this is more for single purpose events, rather than general purpose events,
//this is a single purpose event source, use for articular events
export class SingleEventSource<T> {
  protected _listeners;

  constructor() {
    this._listeners = new Set<Listener<T>>();
  }

  subscribe = (listener: Listener<T>): UnsubscribeListener => {
    this._listeners.add(listener);

    return () => this._listeners.delete(listener);
  };

  notify = (event: T) => {
    this._listeners.forEach((listener) => listener(event));
  };
}

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

  //? ok so there are 2 things, one is local event sources that have emit, that emit to local listeners
  //? the similar naming sense is followes in sockets but for emitting it to the backend :/ should be safe dunno :/
  //emits the event

  // abstract emit<K extends keyof T>(event: K, data: T[K]): void;
  // abstract emitAwait //coming soon
  // emit<K extends keyof T>(event: K, data: T[K]) {
  //   if (!this.events[event]) {
  //     return;
  //   }

  //   for (let cb of this.events[event]) {
  //     cb.exec(data);
  //   }
  // }
}
