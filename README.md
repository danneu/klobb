
<img src="doak.png" align="right" height="300" hspace="5px">

# klobb

[![Build Status](https://travis-ci.org/danneu/klobb.svg?branch=master)](https://travis-ci.org/danneu/klobb)
[![NPM version](https://badge.fury.io/js/klobb.svg)](http://badge.fury.io/js/klobb)
[![Dependency Status](https://david-dm.org/danneu/klobb.svg)](https://david-dm.org/danneu/klobb)

[![NPM](https://nodei.co/npm/klobb.png?downloads=true&downloadRank=true&stars=true)](https://nodei.co/npm/klobb/)

A small, experimental, functional Node.js web server
focused on middleware, immutability, and the
simple abstraction of `Handler(Request) -> Response`.

klobb boils down to this:

- **Handlers** are async functions of signature `Request -> Response`.
- **Middleware** are higher-order functions of signature `Handler -> Handler`.
- **Requests** and **Responses** are [Immutable.js Maps][maps].

[maps]: https://facebook.github.io/immutable-js/docs/#/Map

## Install

```
npm install --save klobb
```

`package.json`:

``` javascript
{
  ...
  "scripts": {
    "start": "klobb -p 3000 index.js"
  }
}
```

An app in klobb just needs to export a default async handler
function.

`index.js`:

``` javascript
import { Response } from 'klobb';

export default async function(request) {
  return Response.ok('Hello, world!');
}
```

Now serve it:

```
$ npm start
Listening on 3000
```

<http://localhost:3000/>

Sometimes I have trouble getting klobb's CLI to launch the server
til I add a `.babelrc` to my project root: 

``` javascript
{
  "presets": ["es2015"],
  "plugins": [
    "transform-runtime",
    "syntax-async-functions",
    "transform-async-to-generator",
    "array-includes"
  ]
}
```

I have a weak understanding of where Babel looks for config. #willfix

## Why?

Inspired by Clojure's [ring](https://github.com/ring-clojure/ring), klobb
aims to make systems slower and easier to reason about by modeling
the request/response cycle as a succession of pure transformations:

    Handler(Request) -> Response

For contrast, Node itself and thus other Node frameworks like
Express and Koa expose the request and response as mutable arguments
to all functions:

    (Response, Response) -> ??? -> (Request, Response)

My goal with klobb is to see if I can arrive at a nice developer experience
for this abstraction in Javascript.

## Example

### Basic

Logging is a classic demonstration of the middleware abstraction.

``` javascript
// server.js
import { Response, compose } from 'klobb'

function logger() {
  return function middleware(handler) {
    return async function newHandler(request) {
      console.log(`--> ${request.method} ${request.url}`);
      const start = Date.now();
      const response = await handler(request);
      console.log(`<-- ${response.status} - ${Date.now() - start} ms`);
      return response;
    }
  }
}

const middleware = logger();

const handler = async function(request) {
  return Response.ok('Hello world');
}

export default middleware(handler);
```

### Batteries Included

klobb also comes with a `Batteries` module that implements (untested)
common and demonstratively useful middleware.

``` javascript
import { Response, Batteries, compose } from 'klobb';
const Cookie = Batteries.Cookie;

const middleware = compose(
  Batteries.logger(),
  Batteries.notModified({ etag: true }),
  Batteries.serveStatic('public', { maxage: 1000 * 60 * 60 * 24 }),
  Batteries.jsonBodyParser(),
  Batteries.Cookie.middleware(),
  Batteries.Flash.middleware()
);

// You update cookies by simply returning a response with the
// cookies you want to send to the client

async function handler(request) {
  const views = (parseInt(Cookie.get('views', request), 10) || 0) + 1;

  return Response.ok(`You have viewed this page ${views} time(s)`)
    .tap(Cookie.set('views', views));
}

export default middleware(handler);
```

### Routing

I cobbled together a router that takes a tree and outputs a handler function.

``` javascript
import { Response, Batteries, compose } from 'klobb';

const middleware = compose(...);

const handler = Batteries.router({
  '/': {
    // stick middleware anywhere. they'll get applied to all downstream
    // routes and compose with any downstream middleware.
    middleware: [mw1(), mw2()],
    '/r': {
      '/:subreddit': {
        middleware: [loadSubreddit()],
        GET: (request) => { 
          const subreddit = request.getIn(['state', 'params', 'subreddit']);
          return Response.ok(`viewing subreddit ${subreddit}`)
        }
      }
    },
    '/u' {
      '/:user': {
        middleware: [loadUser()],
        GET: (request) => { 
          const user = request.getIn(['state', 'params', 'user']);
          return Response.ok(`viewing user ${user}`)
        },
        '/:example': {
          GET: () => Response.ok(':)')
        }
      }
    }
  }
});


export default middleware(handler);
```

#### Wildcards (`/users/:id`) and params

Wildcard segments like `'/:user'` accrete a params map that can be found
in `request.getIn(['state', 'params'])`.

Wildcards only match if there isn't an exact match segment on the same level.
For instance, `GET /foo` will always match `/foo` before `/:uname`.

If `GET /users/42/big/zzz` matches the route path `'/users/:id/:size/zzz'`,
then `request.getIn(['state', 'params'])`:

    { id: '42', size: 'big' }

#### Route nesting

``` javascript
const adminRoutes = {
  '/admin': {
    middleware: [ensureAdmin()],
    GET: () => Response.ok('admin panel'),
    '/users': {
      '/:user_id': {
        DELETE: () => {}
      }
    }
  }
};

const handler = Batteries.router({
  '/': {
    GET: () => Response.ok('ok'),
    '/admin': adminRoutes['/admin']
  }
});
```

### Templating

It's trivial to bring your own templating. Just wrap your favorite library
with a promise that resolves into HTML and then `await` it.

klobb comes with a wrapper for [Nunjucks][jux] in its Batteries module.
It's just 28 lines of code.

``` javascript
import { Batteries } from 'klobb';

const render = Batteries.nunjucks('views', {
  ext: '.html',
  noCache: process.env.NODE_ENV === 'development'
});

const handler = Batteries.router({
  '/': {
    GET: async (request) => Response.ok(await render('homepage'))
    '/:uname': {
      middleware: [ensureAuthorized()],
      GET: async (request) => {
        const user = await db.getUser(request.getIn(['state', 'params', 'uname']));
        if (!user) return Response.notFound();
        return Response.ok(await render('show-user', { user: user }));
      }
    }
  }
});
```

The code above would expect `views/homepage.html` and `views/show-user.html`
to exist, relative to the project root.

[jux]: https://mozilla.github.io/nunjucks/

## Concepts

### Response

A basic response just needs three keys:

``` javascript
{
  status: 200,
  headers: { 'content-type': 'text/plain' },
  body: 'Hello, world!' // body can be one of String, Buffer, or Stream
}
```

### Request

A request looks something like this:

``` javascript
{
  method: 'GET',
  url: '/test?foo=42',
  path: '/test',
  headers: {},
  body: 'Hello, world!',
  querystring: '?foo=42',
  ip: '1.2.3.4,'
  nreq: { ... underlying Node request ... }
}
```

Though without any additional middleware, klobb does not parse the body
at all.

The underlying Node request is always available at `request.nreq` and
is never converted into an immutable map itself.

### Handler :: async (Request -> Response)

A handler is an `async` function that takes a request and returns a response.

Being an `async` function, it actually returns a promise that you `await`,
but like Koa, klobb tries to free you from having to work with promises
directly in your middleware/handlers.

Here's a basic handler:

``` javascript
async function handler(req) {
  return new Response(200, {}, 'Hello, world!');
}
```

And here are some conveniences functions for making responses:

``` javascript
async function handler(req) {
  return Response.make(200, {}, body);  // alternative to `new` constructor
  return Response.ok(body);             // 200
  return Response.notFound();           // 404
  return Response.notModified();        // 304
  return Response.json({ foo: 'bar' }); // JSON encoded
  return Response.redirect(url);        // 302 Temporary
  return Response.redirect(url, 301);   // 301 Permanent
}
```

### Middleware :: Handler -> Handler

Middleware are functions that take and return handlers.

``` javascript
function noop(handler) {
  return newHandler(request) {
    // request is going downstream
    const response = await handler(request);
    // response is coming upstream
    return response;
  };
}
```

Use `Middleware.compose` to compose middleware.

``` javascript
// compose is re-exported from the root module for convenience
import { compose } from 'klobb'; 

const middleware = compose(mw1, mw2, mw3);
export default middleware(handler);
```

`compose` returns a function that applies middleware from right to left
to the handler argument:

``` javascript
const middleware = compose(a, b, c)(handler);
const middleware = a(b(c(handler)));
```

During a request, the above middleware execution order
can be visualized as this:

               +-------------------------------------------------+
               |    +---------------------------------------+    |
               |    |    +-----------------------------+    |    |
               |    |    |                             |    |    |
    request -> a -> b -> c -> (handler -> response) -> c -> b -> a -> response
       ^                                                                 |
       |                                                                 v
     client                                                            client

That is, in `compose(a, b, c)`, middleware `a` touches the request first 
and the response last.

The benefit of using klobb's own `compose` function is that it wraps
each middleware function to promote null responses into 404 responses.

``` javascript
async function handler(request) {
  return;  // will get promoted into a 404
}

// e.g.

import { Response } from 'klobb';

async function handler(request) {
  return Response.notFound();
}
```

I would pefer to find a way to achieve this without having to provide
my own compose function.

## License

MIT
