export class MockWindow {
  _listeners: { [event: string]: (() => void)[] } = {};

  addEventListener(event: "focus" | "offline", handler: () => void) {
    if (!this._listeners[event]) {
      this._listeners[event] = [];
    }
    this._listeners[event].push(handler);
  }

  notify(event: "focus" | "offline") {
    const listeners = this._listeners[event];
    if (listeners) {
      listeners.forEach((handler) => {
        handler();
      });
    }
  }

  //dummy
  removeEventListener(event: "focus" | "offline", handler: () => void) {}
}
