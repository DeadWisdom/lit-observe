import { fixture, assert, html } from '@open-wc/testing';
import { default as sinon } from 'sinon';
import {LitElement} from 'lit-element';
import {observer} from '../src/observer.js'
import {Observable} from '../src/observable.js'


describe("Observer", async () => {
  const a = new Observable();
  const aUnsubscribe = sinon.spy(a, '_removeSubscription');
  const b = new Observable();
  const bUnsubscribe = sinon.spy(b, '_removeSubscription');

  class TestComponent extends observer(LitElement) {
    static get properties() {
      return {
        observed: { type: Object, observe: true },
        otherObserved: { type: Object, observe: true },
        notObserved: { type: Object }
      };
    }

    static get observing() {
      return [b];
    }

    requestUpdate(...args) {
      console.log('requestUpdate', args);
      return super.requestUpdate(...args);
    }
  }

  customElements.define('test-component', TestComponent);

  it('Observer updates when observable updates.', async () => {
    const el = await fixture(html`<test-component></test-component>`);
    const renderFn = sinon.spy(el, 'render');

    assert.equal(renderFn.callCount, 0);
    el.observed = a;
    await el.updateComplete;
    assert.equal(renderFn.callCount, 1);
    a.notify();
    await el.updateComplete;
    assert.equal(renderFn.callCount, 2);
  });

  it('Observer doesn\'t update when not observing property.', async () => {
    const el = await fixture(html`<test-component></test-component>`);
    const renderFn = sinon.spy(el, 'render');

    assert.equal(renderFn.callCount, 0);
    el.notObserved = a;
    await el.updateComplete;
    assert.equal(renderFn.callCount, 1);
    a.notify();
    await el.updateComplete;
    assert.equal(renderFn.callCount, 1);
  });

  it('Observer observes class observing.', async () => {
    const el = await fixture(html`<test-component></test-component>`);
    const renderFn = sinon.spy(el, 'render');

    assert.equal(renderFn.callCount, 0);
    b.notify();
    await el.updateComplete;
    assert.equal(renderFn.callCount, 1);
  });

  it('Observer stops observing.', async () => {
    const el = await fixture(html`<test-component .observed="${a}"></test-component>`);
    const renderFn = sinon.spy(el, 'render');

    assert.equal(renderFn.callCount, 0);
    a.notify();
    await el.updateComplete;
    assert.equal(renderFn.callCount, 1);

    el.observed = null;
    await el.updateComplete;
    assert.equal(renderFn.callCount, 2);

    a.notify();
    await el.updateComplete;
    assert.equal(renderFn.callCount, 2);
  });

  it('Observer can observe the same thing twice.', async () => {
    const el = await fixture(html`<test-component .observed="${a}" .otherObserved="${a}"></test-component>`);
    const renderFn = sinon.spy(el, 'render');

    assert.equal(renderFn.callCount, 0);
    a.notify();
    await el.updateComplete;
    assert.equal(renderFn.callCount, 1);

    el.observed = null;
    await el.updateComplete;
    assert.equal(renderFn.callCount, 2);

    a.notify();
    await el.updateComplete;
    assert.equal(renderFn.callCount, 3);

    el.otherObserved = null;
    await el.updateComplete;
    assert.equal(renderFn.callCount, 4);

    a.notify();
    await el.updateComplete;
    assert.equal(renderFn.callCount, 4);
  });

  it('Observer unhooks when unassigned.', async () => {
    const el = await fixture(html`<test-component .observed="${a}"></test-component>`);
    
    aUnsubscribe.resetHistory();
    assert.isFalse(aUnsubscribe.called);
    el.observed = null;
    await el.updateComplete;
    assert.isTrue(aUnsubscribe.called);
  });

  it('Observer unhooks when element disconnected.', async () => {
    const el = await fixture(html`<test-component .observed="${a}"></test-component>`);
    
    aUnsubscribe.resetHistory();
    bUnsubscribe.resetHistory();
    
    assert.isFalse(aUnsubscribe.called);
    assert.isFalse(bUnsubscribe.called);
    
    el.disconnectedCallback();

    assert.isTrue(aUnsubscribe.called);
    assert.isTrue(bUnsubscribe.called);
  });

  it('Observer doesn\'t do anything after assignment of same observer.', async () => {
    const el = await fixture(html`<test-component .observed="${a}"></test-component>`);
    const renderFn = sinon.spy(el, 'render');
    
    aUnsubscribe.resetHistory();
    
    assert.equal(renderFn.callCount, 0);
    assert.isFalse(aUnsubscribe.called);
    
    el.observed = a;
    await el.updateComplete;
    
    assert.equal(renderFn.callCount, 0);
    assert.isFalse(aUnsubscribe.called);
  });
})