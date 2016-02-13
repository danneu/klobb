
// Node
import * as http from 'http'
// 3rd party
import statuses from 'statuses'
// 1st party
import Request from './Request'
import Response from './Response'
import * as Handler from './Handler'
import * as Middleware from './Middleware'
import * as Batteries from './Batteries'
import * as belt from './belt'

const DEV = process.env.NODE_ENV === 'development'

// Convenience re-exports

export { Response, Request, Handler, Middleware, Batteries }
export const compose = Middleware.compose
export const createError = belt.createError

// =========================================================

// Handler -> Server
export function serve (handler, opts = {}) {
  // If handler doesn't return a response, lift into a 404
  handler = Handler.ensureResponse(handler)

  // Wrap handler so that it responds to any uncaught errors
  const rootHandler = Handler.whenError(handler, onError)

  const server = http.createServer((nreq, nres) => {
    const responsePromise = rootHandler(Request.fromNode(nreq, opts))
    responsePromise
      .then((response) => {
        Response.send(response, nres)
      })
      .catch((err) => {
        // Note: This shouldn't happen
        console.error(err.stack)
        nres.end()
      })
  })

  return server
}

// Root handler wrapper that turns all uncaught errors into responses,
// 500 if err.status is not defined.
//
// Error -> Response
function onError ({ status = 500, message, stack }) {
  console.error(stack)
  message = message || statuses[status]
  return new Response(status, {}, DEV ? stack : message)
}
