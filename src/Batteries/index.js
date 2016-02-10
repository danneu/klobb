
// 1st
import logger from './logger';
import serveStatic from './serve-static';
import jsonBodyParser from './json-body-parser';
import notModified from './not-modified';
import Cookie from './cookies';
import Flash from './flash';
import router from './router';

//
// "Batteries included"
//
// This module exports Batteries which are just built-in middleware.
// They are untested, but can serve as a demonstration.
//

export { 
  logger,
  serveStatic, 
  jsonBodyParser,
  notModified,
  Cookie,
  Flash,
  router,
};


// After building the Cookie module, the best convention might be:
//
//     export default { get, set, expire, middleware };
//
// Where middleware modules always have a default export with the same API
// (always a middleware) function at the very least.
// That way middleware modules can naturally export other functions
// that may be necessary to interact with the features they provide.
// See Batteries/cookies.js
