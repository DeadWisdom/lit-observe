export class Observable {
  constructor(properties) {
    Object.assign(this, properties);
  }

  subscribe(fn) {
    if (!this.__subscriptions) {
      Object.defineProperty(this, "__subscriptions", {
        value: new Set(),
        writable: false,
        enumerable: false,
      });
    }
    let sub = new Subscription(this, fn);
    this.__subscriptions.add(sub);
    return sub;
  }

  notify() {
    if (!this.__subscriptions) {
      return;
    }
    this.__subscriptions.forEach((sub) => {
      sub.observer(this);
    });
  }

  _removeSubscription(sub) {
    if (!this.__subscriptions) return;
    this.__subscriptions.delete(sub);
  }
}

export class Subscription {
  constructor(subject, observer) {
    this.observer = observer;
    this.subject = subject;
  }

  unsubscribe() {
    this.subject._removeSubscription(this);
  }
}
