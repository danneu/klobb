
// 3rd
import R from 'ramda'
// 1st
import * as Handler from './Handler'

// Middleware -> Middleware
function ensureResponse (mw) {
  return function middleware (handler) {
    return mw(Handler.ensureResponse(handler))
  }
}

// Combines multiple middleware into a single middleware function.
// But also wraps each middleware to promote nil return values into
// 404 responses.
//
// ...Middleware -> Middleware
export function compose (...mws) {
  // inject noop() middleware so that compose() without middleware
  // still creates a valid middleware function.
  mws = [...mws, noop()].map(ensureResponse)
  const composed = R.compose(...mws)

  return function middleware (handler) {
    return composed(Handler.ensureResponse(handler))
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
export function make (f) {
  return () => {
    return function middleware (handler) {
      return async function newHandler (request) {
        return f(handler, request)
      }
    }
  }
}

// BUILT-IN / INTERNAL MIDDLEWARE

// The following is middleware that klobb may apply when wrapping the
// application's final handler.

// Middleware that does nothing
//
// () -> Middleware
export function noop () {
  return function middleware (handler) {
    return handler
  }
}

// Handle HEAD requests. klobb wraps final handler with this.
export const wrapHead = (() => {
  // Turn HEAD request into GET request
  function headRequest (request) {
    if (request.method === 'HEAD') return request.set('method', 'GET')
    return request
  }

  // Strip response body if response is not nil and original request was HEAD
  function headResponse (response, request) {
    if (response && request.method === 'HEAD') {
      return response.setBody('')
    } else {
      return response
    }
  }

  return make(async (handler, request) => {
    const response = await handler(headRequest(request))
    return headResponse(response, request)
  })
})()
