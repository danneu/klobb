
// 3rd
import generateEtag from 'etag'
import R from 'ramda'
// 1st
import { Response } from '..'

export default function notModified ({ etag: etag = false } = {}) {
  return function middleware (handler) {
    return async function newHandler (request) {
      const response = await handler(request)

      // only consider HEAD and GET requests
      if (!R.contains(request.method, ['HEAD', 'GET'])) {
        return response
      }

      // only consider 200 responses
      if (response.status !== 200) {
        return response
      }

      // only consider stale requests
      {
        const etaggedResponse = assocEtagIf(etag, response)
        if (!isCached(request, etaggedResponse)) {
          return etaggedResponse
        }
      }

      // serve 304 Not Modified
      return Response.notModified()
    }
  }
}

// =========================================================

// (Boolean, Response) -> Response
function assocEtagIf (etagEnabled, response) {
  if (!etagEnabled) return response
  const entity = (response.body && response.body._stats) || response.body
  // etag must be string, buffer, or fs.Stats object
  const etag = generateEtag(entity)
  return response.setHeader('etag', etag)
}

// =========================================================

// The client has a cached version of a request if they have an
// etag match or if the resource has not been modified.
//
// (Request, Response) -> Bool
function isCached (request, response) {
  return doesEtagMatch(request, response) || notModifiedSince(request, response)
}

// (Request, Response) -> Bool
function notModifiedSince (request, response) {
  const modifiedAt = Date.parse(response.getHeader('last-modified'))
  if (!modifiedAt) return false
  const target = Date.parse(request.getHeader('if-modified-since'))
  if (!target) return false
  return Math.floor(modifiedAt / 1000) <= Math.floor(target / 1000)
}

// Returns true if the response's etag exists and if it matches
// the request's target.
//
// (Request, Response) -> Bool
function doesEtagMatch (request, response) {
  const etag = response.getHeader('etag')
  if (!etag) return false
  const target = request.getHeader('if-none-match')
  if (!target) return false
  return etag === target
}
