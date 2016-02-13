
// 3rd
import getRawBody from 'raw-body'
import mime from 'mime-types'
import typeIs from 'type-is'
// 1st
import { createError } from '..'

// Allowed whitespace is defined in RFC 7159
// http://www.rfc-editor.org/rfc/rfc7159.txt
const strictRe = /^[\x20\x09\x0a\x0d]*(\[|\{)/

const defaultTypes = ['json']

// opts:
// - limit (default: '1mb')
//     passed to raw-body
// - encoding
//     passed to raw-body
//     set it to force an encoding, else it'll be inferred from content-type
//     charset and default to 'utf8' if there is not given charset
//
// - force (default: false)
//     if true, then request throws 415 Unsupported Media Type if
//     content-type matches no configured types.
//     if false, request is just passed downstream
// - strict (default: true)
//     json must be object or array
export default function jsonBodyParser (
  { limit: limit = '1mb'
  , encoding
  , force = false
  , strict = true
  } = {}
) {
  const opts = { limit, encoding }
  return function middleware (handler) {
    return async function newHandler (request) {
      // Short-circuit if request has no body
      if (!typeIs.hasBody(request.nreq)) {
        if (!force) return handler(request)
        throw createError(400, 'Missing request body')
      }

      // Short-circuit if it's not a JSON request
      if (!request.typeIs(...defaultTypes)) {
        if (!force) return handler(request)
        throw createError(415)
      }

      // Expected length of the stream
      opts.length = request.getHeader('content-length')
      // If no encoding expected, then parse it from the request's content-type
      if (!opts.encoding) {
        opts.encoding = mime.charset(request.getHeader('content-type')) || 'utf8'
      }

      // Should always resolve a string since we have a default encoding
      let bodyString
      try {
        bodyString = await getRawBody(request.nreq, opts)
      } catch (err) {
        throw createError(400, err.type, err)
      }

      // Strict check
      if (strict && !strictRe.test(bodyString)) {
        throw createError(400, 'JSON must be object or array')
      }

      // Parse JSON
      let json
      try {
        json = JSON.parse(bodyString)
      } catch (err) {
        throw createError(400, 'Invalid JSON', err)
      }

      // Successful parse
      return handler(request.setBody(json))
    }
  }
}
