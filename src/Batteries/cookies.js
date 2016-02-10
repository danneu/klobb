
// Node
import assert from 'assert';
// 3rd
import R from 'ramda';
import cookie from 'cookie';
import Immutable from 'immutable';
import _ from 'lodash';
// 1st
import { Response } from '..';

//
// Cookie middleware
//

// Usage example
//
//     async function handler(request) {
//       // Get or initialize counter from request cookie
//       const counter = Number.parseInt(Cookie.get('counter', request)) || 0;
//     
//       // Set a cookie using Cookie.set(key, val, response)
//       // - val is { value: newValue, ...opts }
//       // - if val is not an object, then it desugars into { value: val }
//       return Response.ok()
//         .tap(Cookie.set('counter', counter + 1))
//         .tap(Cookie.set('test_key', {
//           value: 'test_value',
//           httpOnly: true,
//           maxAge: 1000 * 60 * 60 // seconds, expire in one hour
//         }));
//     }

////////////////////////////////////////////////////////////

// r can be request or response
//
// Since it's curried, it's convenient to use with #tap.
//
// Ex:
//
//      Cookie.get('key', request) -> value
//      Cookie.get('key', response) -> value
//      request.tap(Cookie.get('key')) -> value
//      response.tap(Cookie.get('key')) -> value
//
// String -> R -> R
const get = R.curry((key, r) => {
  return r.getIn(['state', 'cookies', key]);
});

// val can be string or object
// See full options here: https://github.com/jshttp/cookie#more
//
// Since it's curried, it's convenient to use with #tap.
//
// Ex:
//
//      Cookie.set('key', 'val', response) -> Response
//      Cookie.set('key', { value: 'val', ... }, response) -> Response
//      response.tap(Cookie.set('key', 'val')) -> Response
//      response.tap(Cookie.set('key', { value: 'val', ...})) -> Response
//
// String -> Object -> Response
const set = R.curry((key, opts, response) => {
  assert(response instanceof Response);
  if (!_.isPlainObject(opts)) {
    opts = { value: opts };
  }
  return response.setIn(['state', 'cookies', key], new Immutable.Map(opts));
});

// Delete cookie (sends Set-Cookie header with expires set to the past)
//
// String -> Response -> Response
const expire = R.curry((key, response) => {
  assert(response instanceof Response);
  return response.setIn(['state', 'cookies', key], new Immutable.Map({
    value: '',
    expires: new Date(0)
  }));
});

// () -> Middleware
function middleware() {
  return function middleware(handler) {
    return async function newHandler(request) {
      return cookieResponse(await handler(cookieRequest(request)));
    }
  }
}

////////////////////////////////////////////////////////////

// Parses cookie header into request.cookies Immutable.Map
//
// Request -> Request
function cookieRequest(request) {
  // Map of cookie key->vals
  const parsed = cookie.parse(request.getHeader('cookie') || '');
  const cookies = new Immutable.Map(parsed);
  return request.setIn(['state', 'cookies'], cookies);
}

// Converts response.cookies Immutable.Map into Set-Cookie response headers.
// Deletes the .cookies key when done.
//
// NOTE: Since response can set multiple Set-Cookie headers, 
//       response.headers['set-cookie'] is an array [[k, v], [k, v]]
// TODO: Handle the case where Set-Cookie header already exists but
//       it's not an Immutable.List. This should be abstracted away.
//
// Response -> Response
function cookieResponse(response) {
  return response.updateIn(['headers', 'set-cookie'], v => {
    return (v || new Immutable.List()).withMutations(list => {
      for (let [k, obj] of response.getIn(['state', 'cookies'])) {
        // obj is at least { value: ... }
        const cookieValue = obj.get('value');
        const cookieOpts = obj.remove('value').toJS();
        list.push(cookie.serialize(k, cookieValue, cookieOpts));
      }
    });
  }).remove('cookies');
}


////////////////////////////////////////////////////////////
// Public API
////////////////////////////////////////////////////////////

export default { get, set, expire, middleware };
