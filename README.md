
*weekend-ware, proof-of-concept level work-in-progress*

# klobb

[![Build Status](https://travis-ci.org/danneu/klobb.svg?branch=master)](https://travis-ci.org/danneu/klobb)
[![NPM version](https://badge.fury.io/js/klobb.svg)](http://badge.fury.io/js/klobb)
[![Dependency Status](https://david-dm.org/danneu/klobb.svg)](https://david-dm.org/danneu/klobb)

[![NPM](https://nodei.co/npm/klobb.png?downloads=true&downloadRank=true&stars=true)](https://nodei.co/npm/klobb/)

A small, experimental, functional Node.js web server
focused on middleware, immutability, and the
simple abstraction of `Handler(Request) -> Response`.

In klobb, there are Handlers, Middleware, and immutable datastructures
that repesent the Request and Response.

- Handlers are async functions of signature `Request -> Response`.
- Middleware are higher-order functions of signature `Handler -> Handler`.
- Requests and Responses are [Immutable.js Maps][maps], so they have
a rich API for data manipulation, though klobb provides some higher
level helpers in the Request and Response modules.

[maps]: https://facebook.github.io/immutable-js/docs/#/Map

```
npm install --save klobb
```

Simply export a handler function and run it with `klobb`'s CLI.

Minimal example:

``` javascript
// server.js
import { Response } from 'klobb'

export default async function handler(request) {
  return new Response(200, { 'content-type': 'text/plain' }, 'Hello world');
  // or
  return Response.ok('Hello world');
}
```

Example with middleware:

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

const middleware = compose(logger(), serveStatic('public'));
const handler = async (request) => Response.ok('Hello world');

export default middleware(handler);
```

Serve:

```
$ klobb -p 3000 server.js
Listening on 3000
```

## Why?

Inspired by Clojure's [ring](https://github.com/ring-clojure/ring), klobb
aims to make systems slower and easier to reason about by modeling
the request/response cycle as a succession of pure transformations:

    Handler(Request) -> Response

For contrast, Node itself and thus other Node frameworks like
Express and Koa expose the request and response as mutable arguments
to all functions:

    (Response, Response) -> ??? -> (Request, Response)

## Concepts

### Response

A basic response looks like this:

``` javascript
{
  status: 200,
  headers: { 'content-type': 'text/plain' },
  body: 'Hello, world!'
}
```

It always has those three keys.

`body` can be a string, buffer, or stream.

### Request

A request kinda looks something like this:

``` javascript
{
  url: '/test?foo=42',
  method: 'GET',
  headers: {},
  body: 'Hello, world!',
  querystring: '?foo=42'
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

However, it's preferrable to use the conveniences in klobb's `Response` module:

``` javascript
import { Response } from 'klobb';

async function handler(request) {
  return Response.ok('Hello, world');
}
```

### Middleware :: Handler -> Handler

Middleware are plain ol functions that take and return handlers.

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

Here's the classic example of middleware that times each request:

``` javascript
function timer(handler) {
  return newHandler(request) {
    const start = Date.now();
    const response = await handler(request);
    console.log(`Time: ${start - Date.now()} ms`);
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
const middleware = compose(a, b, c)(handler)
// is kinda like this
const middleware = a(b(c(handler)));
```

Finally, during a request the above middleware execution order
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

## Full Example

Let's combine the examples so far on this README into an application and
run it.

``` javascript
// server.js
import { Response, compose } from 'klobb';

function timerWare(handler) {
  return async function newHandler(request) {
    console.log('[>> enter timerWare]');
    const start = Date.now();
    const response = await handler(request);
    console.log(`[timerWare] ${start - Date.now()} ms`);
    console.log('[<< exit timerWare]');
    return response;
  }
}

function noopWare(handler) {
  return async function newHandler(request) {
    console.log('[>> enter noopWare]');
    const response = await handler(request);
    console.log('[<< exit noopWare]');
    return response;
  }
}

async function helloHandler(request) {
  console.log('[>> enter helloHandler]');
  const response = Response.ok('Hello, world!');
  console.log('[helloHandler] bubbling up the response now');
  console.log('[<< exit helloHandler]');
  return response;
}

const middleware = compose(timerWare, noopWare);
export default middleware(helloHandler);
```

Here's what the server logs look like when you visit the resulting service:

```
$ klobb server.js
listening on 3000

$ curl http://localhost:3000
[>> enter timerWare]
[>> enter noopWare]
[>> enter helloHandler]
[helloHandler] bubbling up the response now
[<< exit helloHandler]
[<< exit noopWare]
[timerWare] 3 ms
[<< exit timerWare]
```

## More Info

Returning `undefined` from middleware/handlers will resolve into a 404 response.

``` javascript
async function handler(request) {
  return;
}

// same as

import { Response } from 'klobb';

async function handler(request) {
  return Response.notFound();
}
```

## License

MIT
