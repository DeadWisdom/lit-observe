
export function observer(cls) {
  return class extends cls {
    update(props) {
      props.forEach((old, key) => {
        this.__subscriptionManager.managePropertyChange(key, old);
      });
      super.update(props);
    }

    observeUpdate(subject, name) {
      this._requestUpdate();
    }
     
    constructor() {
      super();

      Object.defineProperty(this, "__subscriptionManager", {
        value: new SubscriptionManager(this),
        writable: false,
        enumerable: false,
      });
    }

    connectedCallback() {
      super.connectedCallback();
      this.__subscriptionManager.connectClassSubscriptions();
    }

    disconnectedCallback() {
      super.disconnectedCallback();
      this.__subscriptionManager.disconnectSubscriptions();
    }
  };
}

class SubscriptionManager {
  // Manages subscriptions for an UpdatingElement
  constructor(element) {
    this.element = element;
    this.namedSubscriptions = new Map();
    this.unnamedSubscriptions = new Set();
  }

  connectClassSubscriptions() {
    const subjects = this.element.constructor.observing;
    if (!subjects) return;
    subjects.forEach((sub) => {
      const fn = () => {
        this.element.observeUpdate(sub);
      };
      this.addSubscription(sub.subscribe(fn))
    });
  }

  disconnectSubscriptions() {
    this.namedSubscriptions.forEach((sub, key) => sub.unsubscribe());
    this.namedSubscriptions.clear();
    this.unnamedSubscriptions.forEach((sub) => sub.unsubscribe());
    this.unnamedSubscriptions.clear();
  }

  managePropertyChange(name, old) {
    if (old === this.element[name]) return; // Same object, nothing to do

    const propMeta = this.element.constructor.getPropertyOptions(name);
    if (propMeta === undefined || !propMeta.observe) {
      // The property isn't defined or we don't have an "observe" attribute on it.
      return;
    }

    this.subscribeToProperty(name, this.element[name]);
  }

  unsubscribeFromProperty(name) {
    const sub = this.namedSubscriptions.get(name);

    if (!sub) {
      return false;
    }

    this.namedSubscriptions.delete(name);
    return sub.unsubscribe();
  }

  subscribeToProperty(name, subject) {
    this.unsubscribeFromProperty(name);

    if (!subject || typeof subject.subscribe !== "function") {
      return false;
    }

    const sub = subject.subscribe(() => {
      this.element.observeUpdate(subject, name);
    });
    this.namedSubscriptions.set(name, sub);
    return true;
  }

  addSubscription(sub) {
    this.unnamedSubscriptions.add(sub);
  }
}
