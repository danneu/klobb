
// 3rd
import getRawBody from 'raw-body'
import mime from 'mime-types'
import typeIs from 'type-is'
import qs from 'qs'
// 1st
import { createError } from '..'

const defaultTypes = ['urlencoded']

export default function formBodyParser (
  { limit: limit = '56kb'
  , encoding
  , force = false
  , qs: qsOpts = {}
  } = {}
) {
  return function middleware (handler) {
    const rawBodyOpts = { limit, encoding }
    return async function newHandler (req) {
      // Short-circuit if request has no body
      if (!typeIs.hasBody(req.nreq)) {
        if (!force) return handler(req)
        throw createError(400, 'Missing request body')
      }

      // Short-circuit if it doesn't have a content-type we care about
      if (!req.checkType(...defaultTypes)) {
        if (!force) return handler(req)
        throw createError(415)
      }

      // Expected length of the stream
      rawBodyOpts.length = req.getHeader('content-length')
      // If no encoding expected, then parse it from the request's content-type
      if (!rawBodyOpts.encoding) {
        rawBodyOpts.encoding = mime.charset(req.getHeader('content-type')) || 'utf8'
      }

      // Should always resolve a string since we have a default encoding
      let bodyString
      try {
        bodyString = await getRawBody(req.nreq, rawBodyOpts)
      } catch (err) {
        throw createError(400, err.type, err)
      }

      let parsed
      try {
        parsed = qs.parse(bodyString, qsOpts)
      } catch (err) {
        throw createError(400, err)
      }

      // Successful parse
      return handler(req.setBody(parsed))
    }
  }
}
