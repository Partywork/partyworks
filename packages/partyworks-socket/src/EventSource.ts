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
