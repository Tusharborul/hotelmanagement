const subscribers = new Set();
let count = 0;

export const loaderBus = {
  increment() {
    count += 1;
    loaderBus.notify();
  },
  decrement() {
    count = Math.max(0, count - 1);
    loaderBus.notify();
  },
  reset() {
    count = 0;
    loaderBus.notify();
  },
  getCount() {
    return count;
  },
  subscribe(fn) {
    subscribers.add(fn);
    return () => subscribers.delete(fn);
  },
  notify() {
    for (const fn of subscribers) {
      try { fn(count); } catch (e) {}
    }
  }
};
