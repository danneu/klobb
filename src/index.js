
// Node
import * as http from 'http';
import assert from 'assert';
// 3rd party
import _ from 'lodash';
// 1st party
import * as Request from './Request';
import * as Response from './Response';
import * as Handler from './Handler';
import * as Middleware from './Middleware';

const DEV = 'development' === process.env.NODE_ENV;

// Convenience re-exports

export { Response, Request, Handler, Middleware };
export const compose = Middleware.compose;

////////////////////////////////////////////////////////////

// Handler -> Server
export function serve(handler, opts = {}) {
  handler = Handler.ensureResponse(handler);

  const rootHandler = Handler.whenError(handler, opts.onError || onErrorDefault);

  const server = http.createServer((nreq, nres) => {
    const responsePromise = rootHandler(Request.fromNode(nreq, opts));
    responsePromise
      .then(response => { 
        Response.mutateNode(response, nres);
        nres.end();
      })
      .catch(err => { 
        // Note: This shouldn't happen
        if (DEV) console.error(err.stack);
        nres.end();
      });
  });

  return server;
}

// Error -> Response
function onErrorDefault({ statusCode, message, stack }) {
  if (statusCode) {
    return Response.make(statusCode, {}, DEV ? stack : message);
  } else {
    return Response.make(500, {}, DEV ? stack : 'Internal Server Error');
  }
  if (DEV) console.error(stack);
}
