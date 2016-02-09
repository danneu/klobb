
// Node
import * as http from 'http';
import assert from 'assert';
// 1st party
import Request from './Request';
import Response from './Response';
import * as Handler from './Handler';
import * as Middleware from './Middleware';
import * as belt from './belt';

const DEV = 'development' === process.env.NODE_ENV;

// Convenience re-exports

export { Response, Request, Handler, Middleware };
export const compose = Middleware.compose;
export const createError = belt.createError

////////////////////////////////////////////////////////////

// Handler -> Server
export function serve(handler, opts = {}) {
  // If handler doesn't return a response, lift into a 404
  handler = Handler.ensureResponse(handler);

  // Wrap handler so that it responds to any uncaught errors
  const rootHandler = Handler.whenError(handler, onError);

  const server = http.createServer((nreq, nres) => {
    const responsePromise = rootHandler(Request.fromNode(nreq, opts));
    responsePromise
      .then(response => { 
        Response.send(response, nres);
      })
      .catch(err => { 
        // Note: This shouldn't happen
        if (DEV) console.error(err.stack);
        nres.end();
      });
  });

  return server;
}

// Root handler wrapper that turns all uncaught errors into responses,
// 500 if err.statusCode is not defined.
//
// Error -> Response
function onError({ statusCode, message, stack }) {
  if (statusCode) {
    return new Response(statusCode, {}, DEV ? stack : message);
  } else {
    return new Response(500, {}, DEV ? stack : 'Internal Server Error');
  }
  if (DEV) console.error(stack);
}
