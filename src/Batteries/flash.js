
// Node
import assert from 'assert';
// 3rd
import Immutable from 'immutable';
import R from 'ramda';
// 1st
import Cookie from './cookies';
import { Request, Response } from '..';

// String -> Request -> JSONValue
const get = R.curry((key, request) => {
  assert(typeof key === 'string');
  assert(request instanceof Request);
  return request.getIn(['state', 'flash', key]);
});

// String -> JSONValue -> Response -> Response
const set = R.curry((key, val, response) => {
  assert(typeof key === 'string');
  assert(response instanceof Response);
  return response.setIn(['state', 'flash', key], Immutable.fromJS(val));
});


// Must be downstream from cookie middleware
function middleware() {
  return function middleware(handler) {
    return async function newHandler(request) {
      return flashResponse(await handler(flashRequest(request)));
    }
  }
}

// Request -> Request
function flashRequest(request) {
  // Don't do anymore work if there is no flash cookie
  if (!Cookie.has('_flash', request)) {
    return request.setIn(['state', 'flash'], new Immutable.Map());
  }
  const str = Cookie.get('_flash', request);
  let json; // might be malformed
  try {
    json = JSON.parse(str);
  } catch(err) {
    json = {};
  }
  return request.setIn(['state', 'flash'], new Immutable.Map(json));
}

// Dump .flash state to cookies, JSON encode them, and delete the flash key
//
// Response -> Response
function flashResponse(response) {
  // Nothing to do if there's no flash info to save
  const flash = response.getIn(['state', 'flash']);
  if (!flash || flash.size === 0) {
    return response.remove('flash');
  }
  return response.tap(Cookie.set('_flash', {
    value: JSON.stringify(flash.toJS()),
    maxAge: 10000, // expire after 10 seconds to prevent poor ux of replay
  })).remove('flash');
}

////////////////////////////////////////////////////////////
// Public API
////////////////////////////////////////////////////////////

export default { get, set, middleware };
