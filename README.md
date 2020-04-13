# lit-observe
Simple observable / reactive library for lit-element to manage state.

## Why

State management gets complex real quick. For lit-element the primary need for state is to know when some resource changes so that we can update our web component. You can drive yourself crazy with actions, hooks, or what not, but here's a simple system.

Instead of trying to manage large pieces of state, here we allow LitElement components to bind to special objects, with class `Observable`.  An observable is like a normal `Object`, but it remembers subscribers via `observable.subscribe(callback)`, and tells everyone when it updates via `observable.notify()`.

Now custom elements can manage their internal state with normal properties, but they can also update automatically when observables change. An observable could be as complex as a `Store` object that manages state across the client, or they could be as targeted as a single resource. Up to you.

## Install

Install directly from github. If you want to install from a npm package, create an issue in this repo.

    > npm install --save deadwisdom/lit-observe

## Easy to use

When we create our element, let's do it like this. Our example is an article header:

    // ArticleHeader.js
    import { observer } from 'lit-observe';
    import { user } from './auth.js';

    class ArticleHeader extends observer(LitElement) {
      static get properties() {
        return {
          article: {type: Object, observe: true}
        };
      }

      static get observing() {
        return [user];
      }

      render() {
        if (this.article.loading) {
          return html`Loading...`;
        }
        if (user.isAdmin) {
          return html`${this.article.title} 
          <a href="${this.article.url}/edit">[edit]</a>`;
        }
        return html`${this.article.title}`;
      }
    }
    customElement.define('article-header', ArticleHeader);

    // Use the article header in another component
    export const article = new Observable({loading: true});

    fetch(ARTICLE_URL).then(response => {
      Object.assign(article, response.json());
      article.loading = false;
      article.notify();   // --> Our component updates!
    });

    return 
      html`<article-header .article=${article}></article-header>`;

    // Some other code
    user.isAdmin = true;
    user.notify() // --> Our component updates!


Here's a brief breakdown of what's happens.  If you are confused, or want this broken down further, create an issue in this repo.

`observer` is a mixin that lets our element actually observe.  It automatically hooks on `.connectedCallback()` and unhooks on `.disconnectedCallback()` to observables marked with { observe: true }, and also any observables listed in the `get observing()` static method.

`Observable` is expected to be a base class to whatever your main objects are, but you can also use it plain.  Here, we create the article with `.loading = true`.  In our component, we look render a 'Loading...' as long as that is true.  Once our fetch comes back, we move all of the data to it (via `Object.assign()`) and then run `.notify()`.  All subscribing observers, including our element now update themselves with a call to `.requestUpdate()` via the normal LitElement lifecycle.

`user.notify()` will also update our element, because we have subscribed to it in our `static get observing()` method.

## RxJS

The `Observable` class matches a very small subset of the RxJS Observable interface, so you could swap those in.

## API Reference

Sorry, please look at the source.  If you'd appreciate a real api reference, please create an issue in this repo.

## Running the Tests

  > npm test

