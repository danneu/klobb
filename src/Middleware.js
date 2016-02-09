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

// Wraps each middleware to return a 404 response
// if there is never a response, i.e. if you don't return a response
// from downstream middleware/handlers.
//
// TODO: Handle compose(a, b, c)
//
// [...Middleware] -> Middleware
export function compose(mws) {
  assert(_.isArray(mws));

  // TODO: I don't think I need this noop() anymore, but I'm too tired to
  // think about it.
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
