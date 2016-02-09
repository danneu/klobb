
// 1st
import * as Response from './Response';

// Wrap a handler so that if the inner handler doesn't return a response,
// it returns a 404;
//
// TODO: Provide development option to throw an err when you forget to return
// a response?
//
// Handler -> Handler
export function ensureResponse(handler) {
  const onUndefined = () => Response.notFound();
  return whenUndefined(handler, onUndefined);
}

// (Handler, (() -> Handler)) -> Handler
export function whenUndefined(handler, onUndefined) {
  return async function handlerWrappedWithOnUndefined(request) {
    let response = await handler(request);
    if (!response) {
      response = onUndefined();
    }
    return response;
  }
}

// Wrap handler with a function that will run if downstream
// throws an error and it lands in this try/catch.
//
// (Handler, (Error -> Handler)) -> Handler
export function whenError(handler, onError) {
  return async function handlerWrappedWithOnError(request) {
    let response;
    try {
      response = await handler(request);
    } catch(err) {
      response = onError(err);
    }
    return response;
  }
}
