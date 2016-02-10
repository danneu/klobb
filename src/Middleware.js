// Node
import assert from 'assert';
// 3rd
import _ from 'lodash';
import R from 'ramda';
// 1st
import * as Handler from './Handler';

////////////////////////////////////////////////////////////

// Middleware -> Middleware
function ensureResponse(mw) {
  return function middleware(handler) {
    return mw(Handler.ensureResponse(handler));
  }
}

////////////////////////////////////////////////////////////

// Combines multiple middleware into a single middleware function.
//
// Since middleware are applied from right to left, middleware on the left
// are on the "outside of the ring" -- they get the request before and touch
// the response after middleware on the right.
//
// Example:
//
//     compose(a, b, c)
//
// can be visualized like this:
//
//                +-------------------------------------------------+
//                |    +---------------------------------------+    |
//                |    |    +-----------------------------+    |    |
//                |    |    |                             |    |    |
//     request -> a -> b -> c -> (handler -> response) -> c -> b -> a -> response
//        ^                                                                 |
//        |                                                                 v
//      client                                                            client
//
// Even though middleware are regular functions that can be composed
// using any library (like lodash, ramda, underscore), prefer to use this
// function to compose middleware since it wraps each middleware to return
// a 404 response if there is never a response.
// i.e. if you forget to return a response from downstream middleware/handlers.
//
// ...Middleware -> Middleware
export function compose(...mws) {
  // inject noop() middleware so that compose() without middleware
  // still creates a valid middleware function.
  mws = [...mws, noop()].map(ensureResponse);
  const composed = R.compose(...mws);

  return function middleware(handler) {
    return composed(Handler.ensureResponse(handler));
  }
}

////////////////////////////////////////////////////////////
// Built-in Middleware
////////////////////////////////////////////////////////////

// Middleware that does nothing
//
// () -> Middleware
export function noop() {
  return function middleware(handler) {
    return handler;
  }
}

// Make middleware with less boilerplate. Pass in a function
// that takes Handler and Request as arguments and then returns
// a response.
//
// Note: As per middleware convention, this returns a function 
// () -> Middleware
//
// Ex:
//
//     const mw = Middleware.make(async (handler, req) => {
//       console.log('>>');
//       const res = await handler(req);
//       console.log('<<');
//       return res;
//     });
//
//     const middleware = compose(mw(), mw(), mw());
//
// ((Handler, Request) -> Response) -> (() -> Middleware)
export function make(f) {
  return () => {
    return function middleware(handler) {
      return async function newHandler(request) {
        return f(handler, request);
      }
    }
  }
}
