
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

// Convenience re-exports

export { Response, Request, Handler, Middleware };
export const compose = Middleware.compose;

// Creates a server and begins listening
//
// Handler -> Server
export function listen(handler, port, cb) {
  // FIXME: Middleware.compose will ensure that handler already resolves to 404
  // if it returns undefined, but here we do it again since handler might
  // not have been composed.
  handler = Handler.ensureResponse(handler);

  const rootHandler = Handler.whenError(handler, err => {
    return Response.make(500, {}, err.stack);
  });

  const server = http.createServer((nreq, nres) => {
    const responsePromise = rootHandler(Request.fromNode(nreq));
    responsePromise
      .then(response => { 
        Response.mutateNode(response, nres);
        nres.end();
      })
      .catch(err => { 
        // TODO: dont print stack in prod
        // Note: This shouldn't happen
        console.error(err.stack);
        nres.end();
      });
  });

  server.listen(port, cb);
  return server;
}
