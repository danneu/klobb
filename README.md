
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
- **Requests** and **Responses** are [Immutable.js Records][maps].

``` javascript
import { Response } from 'klobb'

export default function handler (request) {
  return Response.ok('Hello, world!')
}
```

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

export default async function (request) {
  return Response.ok('Hello, world!')
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
    "transform-object-rest-spread"
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

function logger () {
  return function middleware (handler) {
    return async function newHandler (request) {
      console.log(`--> ${request.method} ${request.url}`)
      const start = Date.now()
      const response = await handler(request)
      console.log(`<-- ${response.status} - ${Date.now() - start} ms`)
      return response
    }
  }
}

const middleware = logger()

const handler = async function (request) {
  return Response.ok('Hello world')
}

export default middleware(handler)
```

### Batteries Included

klobb also comes with a `Batteries` module that implements (untested)
common and demonstratively useful middleware.

``` javascript
import { Response, Batteries, compose } from 'klobb'
const Cookie = Batteries.Cookie

const middleware = compose(
  Batteries.logger(),
  Batteries.notModified({ etag: true }),
  Batteries.serveStatic('public', { maxage: 1000 * 60 * 60 * 24 }),
  Batteries.jsonBodyParser(),
  Batteries.Cookie.middleware(),
  Batteries.Flash.middleware()
)

// You update cookies by simply returning a response with the
// cookies you want to send to the client

async function handler (request) {
  const views = (parseInt(Cookie.get('views', request), 10) || 0) + 1

  return Response.ok(`You have viewed this page ${views} time(s)`)
    .tap(Cookie.set('views', views))
}

export default middleware(handler)
```

### Routing

I cobbled together a router that takes a tree and outputs a handler function.

Here's Reddits URL structure:

``` javascript
import { Response, Batteries, compose } from 'klobb'

const middleware = compose(...)

const handler = Batteries.router({
  '/': {
    // stick middleware anywhere. they'll get applied to all downstream
    // routes and compose with any downstream middleware.
    middleware: [mw1(), mw2()],
    '/r': {
      '/:subreddit': {
        middleware: [loadSubreddit()],
        GET: (request) => {
          const subreddit = request.getIn(['state', 'params', 'subreddit'])
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
        }
      }
    }
  }
})

export default middleware(handler)
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
}

const authenticationRoutes = {
  '/login': { GET: ..., POST: ... },
  '/logout': { GET: ..., DELETE: ... },
  '/register': { GET: ..., POST: ... }
}

const handler = Batteries.router({
  '/': {
    GET: () => Response.ok('Homepage'),
    // Mount them to a root
    '/admin': adminRoutes['/admin'],
    // Or spread them in when they're flat
    ...authenticationRoutes
  }
})
```

**Caveat:** The router is naive and doesn't do any sort of backtracking.

Given these two routes:

    /users/admin
    /users/:user/info

The request `GET /users/admin/info` will 404 since the router makes no 
attempt to reverse into the `/:user/info` branch once it commits to the 
`/admin` branch.

### Templating

It's trivial to bring your own templating. Just wrap your favorite library
with a promise that resolves into HTML and then `await` it.

klobb comes with a wrapper for [Nunjucks][jux] in its Batteries module.
It's just 28 lines of code.

``` javascript
import { Batteries } from 'klobb'

const render = Batteries.nunjucks('views', {
  ext: '.html',
  noCache: process.env.NODE_ENV === 'development'
})

const handler = Batteries.router({
  '/': {
    GET: async (request) => Response.ok(await render('homepage'))
    '/:uname': {
      middleware: [ensureAuthorized()],
      GET: async (request) => {
        const user = await db.getUser(request.getIn(['state', 'params', 'uname']))
        if (!user) return Response.notFound()
        return Response.ok(await render('show-user', { user: user }))
      }
    }
  }
})
```

The code above would expect `views/homepage.html` and `views/show-user.html`
to exist, relative to the project root.

[jux]: https://mozilla.github.io/nunjucks/

### Validation

I also put together a quick and dirty validation library in
`Batteries/Validate.js`.

For demonstration, I'll reimplement koa-skeleton's moderately
advanced user-register validation.

``` javascript
import { Batteries, Response, Middleware } from 'klobb'
const Flash = Batteries.Flash
const { v, validateBody, ValidationError } = Batteries.Validate

async function handleSignup (req) {
  // Throws ValidationError if the following fails

  const vals = validateBody(req, {
    uname: [
      v.tip('Username required'),
      v.required(),
      v.isString(),
      v.trim(),
      v.checkPred(s => s.length > 0),
      v.match(/^[a-z0-9_-]+$/i,
        'Username must only contain a-z, 0-9, underscore (_), or hypen (-)'),
      v.match(/[a-z]/i,
        'Username must contain at least one letter (a-z)'),
      v.checkNotPredMemo(memo => db.findUserByUname(memo.val), 'Username taken')
    ],
    password2: [
      v.tip('Password confirmation is required'),
      v.required(),
      v.isString(),
      v.checkPred(s => s.length > 0)
    ],
    password1: [
      v.tip('Password is required'),
      v.required(),
      v.isString(),
      v.checkPred(s => s.length > 0),
      v.isLength(6, 100, 'Password must be 6-100 chars'),
      v.tip('Password must match confirmation'),
      v.checkPredMemo(memo => memo.vals.password2 === memo.val)
    ],
    email: [
      v.optional(),
      v.tip('Invalid email address'),
      v.trim(),
      v.isEmail(),
      v.isLength(1, 140, 'Email is too long')
    ]
  })

  // If it succeeds, then we will make it down here and `vals`
  // will be set to an obj of our validated parameters.

  const user = await db.insertUser(vals.uname, vals.password1, vals.email)

  return Response.redirect(user.url)
    .tap(Flash.set('message', ['success', 'Successfully registered. Welcome!']))
}

const interceptValidationError = Middleware.make(async (handler, request) => {
  try {
    return await handler(request)
  } catch(err) {
    if (err instanceof ValidationError) {
      return Response.redirectBack(request)
        .tap(Flash.set('message', ['dange', err.message || 'Validation error']))
        .tap(Flash.set('progress', request.body))
    }
    throw err
  }
})

const handler = Batteries.router({
  '/': {
    '/users': {
      middleware: [interceptValidationError()],
      POST: handleCreateUser
    }
  }
})
```

[koa-val]: https://github.com/danneu/koa-skeleton/blob/4d654c8963848d171e9b2ae3e0ef91721058d1e1/src/routes/authentication.js#L88-L115

### Error Handling

klobb wraps your handler with its own top-level `try/catch` middleware 
that turns any uncaught `Error` object into a response.

By default, it returns a 500 response with the body 'Internal Server Error'.

If you want to throw a custom status code and message, then just throw
an `Error` with those fields set:

``` javascript
if (invalid) {
  const err = new Error("I can't let you do that, Starfox.")
  err.status = 400
  throw err
}
```

#### `createError` Helper

Though klobb has a convenience function for throwing custom errors,
mainly helpful in that it allows for one-liners:

``` javascript
import { createError } from 'klobb'

if (invalid) {
  throw createError(400, 'My custom message')
  throw createError(400)
}
```

If an error has no `err.message` set, klobb sets the response body to the
standard HTTP description for the status code:

``` javascript
import { createError } from 'klobb';

throw new Error()                => 500 'Internal Server Error'
throw new Error('Uh oh!')        => 500 'Uh oh!'
throw createError(500)           => 500 'Internal Server Error'
throw createError(500, 'Uh oh!') => 500 'Uh oh!'
throw createError(503)           => 503 'Service Unavailable'
throw createError(413)           => 400 'Payload Too Large'
```

#### Custom Error Handling

If you want to handle uncaught errors yourself, just wrap your handler in your
own `try/catch` middleware which will get to handle errors before klobb.

Example: Logging errors and then re-throwing them for klobb to handle:

``` javascript
import { Middleware } from 'klobb'

const logOnErrors = Middleware.make(async (handler, request) => {
  try {
    return await handler(request)
  } catch(err) {
    logError(err)
    throw err
  }
})

const middleware = compose(logOnErrors(), serveStatic('public'), ...)

export default middleware(handler)
```

Or you can just return a response so that klobb's error handling never even
catches any errors, effectively overriding klobb.

Example: Custom error-handler that converts all errors into JSON responses:

``` javascript
import { Middleware, Response } from 'klobb'
import statuses from 'statuses' // npm install --save statuses

const jsonErrors = Middleware.make(async (handler, request) => {
  try {
    return await handler(request)
  } catch(err) {
    const status = err.status || 500
    const message = err.message || statuses[status]
    return new Response(status).json({ error: message })
  }
})

const middleware = compose(jsonErrors(), serveStatic('public'), ...)

export default middleware(handler)
```

### Storing State in the Request/Response

klobb's Request and Response objects are [Immutable.js Records][records].

This basically means that their core keys cannot be removed, and arbitrary
keys cannot be added. But they have most of the instance methods of 
[Immutable.js Maps][maps].

Instead, each Request and Response has a `.state` field which is an
[Immutable.js Map][maps] that can be arbitrarily modified. Any extensions to
a Request or Response should be stored in the state map.

#### Example: Loading the current user

For example, here's an example of common middleware that uses the "session_id"
cookie to load the current user from the database and then attaches the user
to the request so that downstream middleware and handlers can access it:

``` javascript
import { Middleware, Batteries, compose } from 'klobb'
const Cookie = Batteries.Cookie

const loadCurrentUser = Middleware.make(async (handler, request) => {
  const sessionId = Cookie.get('session_id', request)
  if (!sessionId) return handler(request)
  const currUser = await database.getUserBySessionId(sessionId)
  if (!currUser) return handler(request)
  return handler(request.setIn(['state', 'currUser'], currUser))
})

const handler = (request) => {
  const currUser = request.getIn(['state', 'currUser'])
  if (!currUser) return Response.ok('You are not logged in')
  return Response.ok(`You are logged in as ${currUser.uname}`)
};

const middleware = compose(Cookie.middleware(), loadCurrentUser())

export default middleware(handler)
```

### Composing Multiple Apps

Since a klobb app is just a function that takes a Request and returns
a Response (i.e. a handler), it's trivial to compose multiple apps together.

``` javascript
import { Batteries } from 'klobb'
import app1 from './app1'
import app2 from './app2'
import app3 from './app3'

export default Batteries.router({
  '/': {
    '/app1': app1,
    '/app2': app2,
    '/app3': app3
  }
})
```

### Content Negotiation

This abstraction was inspired by Express' [res.format][format].

If you want to respond differently based on the request's `Accept` header,
then `Batteries.negotiate` takes a mapping of accept headers -> handlers and
returns a new handler.

It matches based on `Request#accepts(...types)`.

If none of the branches match, then the negotiate handler returns a
"406 Not Acceptable" response.

``` javascript
const handler = Batteries.negotiate({
  'text/plain': () => Response.ok('Hello'),
  'text/html': () => Response.ok('<p>Hello</p>'),
  'application/json': () => Response.json({ message: 'Hello' })
})
```

Or, even simpler:

``` javascript
const handler = Batteries.negotiate({
  text: () => Response.ok('Hello'),
  html: () => Response.ok('<p>Hello</p>'),
  json: () => Response.json({ message: 'Hello' })
})
```

If you want to hook into the case where none of the branches match, then
you can either wrap the final handle in middleware that checks if
`response.status === 406`.

Or you can provide a `default` branch:

``` javascript
const handler = Batteries.negotiate({
  text: () => ...,
  json: () => ...,
  default: request => {
    console.log('Unhandled accept header: ${request.getHeader('accept')}')
    return new Response(406)
  }
})
```

Though be sure to respond with the appropriate 406 status code if you
implement your own default branch handler.

[format]: http://expressjs.com/en/4x/api.html#res.format

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
async function handler (request) {
  return new Response(200, {}, 'Hello, world!')
}
```

And here are some conveniences functions for making responses:

``` javascript
async function handler (request) {
  return Response.make(200, {}, body)  // alternative to `new` constructor
  return Response.ok(body)             // 200
  return Response.notFound()           // 404
  return Response.notModified()        // 304
  return Response.json({ foo: 'bar' }) // 200, JSON encoded
  return Response.redirect(url)        // 302 Temporary
  return Response.redirect(url, 301)   // 301 Permanent
  return Response.redirectBack()       // 302 Permanent to referrer || homepage
}
```

### Middleware :: Handler -> Handler

Middleware are functions that take and return handlers.

``` javascript
function noop (handler) {
  return newHandler (request) {
    // request is going downstream
    const response = await handler(request)
    // response is coming upstream
    return response
  }
}
```

### Composing Middleware

Use `Middleware.compose` to compose middleware.

``` javascript
// compose is re-exported from the root module for convenience
import { compose } from 'klobb'

const middleware = compose(mw1, mw2, mw3)
export default middleware(handler)
```

`compose` returns a function that applies middleware from right to left
to the handler argument:

``` javascript
const middleware = compose(a, b, c)(handler)
const middleware = a(b(c(handler)))
```

During a request, the above middleware execution order
can be visualized as this:

               +-------------------------------------------------+
               |    +---------------------------------------+    |
               |    |    +-----------------------------+    |    |
               |    |    |                             |    |    |
    request -> a -> b -> c -> (handler -> response) -> c -> b -> a -> response
       ^       |    |    |                             |    |    |       |
       |       |    |    +-----------------------------+    |    |       v
     client    |    +---------------------------------------+    |     client
               +-------------------------------------------------+

That is, in `compose(a, b, c)`, middleware `a` touches the request first
and the response last.

The benefit of using klobb's own `compose` function is that it wraps
each middleware function to promote null responses into 404 responses.

``` javascript
async function handler (request) {
  return  // will get promoted into a 404
}

// e.g.

import { Response } from 'klobb'

async function handler (request) {
  return Response.notFound()
}
```

I would pefer to find a way to achieve this without having to provide
my own compose function.

### Middleware Helpers

`Middleware.make` saves you some boilerplate by letting you create a
Middleware function by passing it a function of signature
`(Handler, Request) -> Response`:

``` javascript
const mw = Middleware.make(async (handler, req) => {
  console.log('>>')
  const res = await handler(req)
  console.log('<<')
  return res
});

const middleware = compose(mw(), mw(), mw())
```

As per [unnecessary?] middleware convention, you must still invoke
the function `mw()` to get the middleware function. This is so that you
don't always need to look up whether a function is middleware or if it
returns middleware. i.e. `mw(opts)` vs `mw`.

## License

MIT

[maps]: https://facebook.github.io/immutable-js/docs/#/Map
[records]: https://facebook.github.io/immutable-js/docs/#/Record

