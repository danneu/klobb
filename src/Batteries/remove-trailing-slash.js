
// 1st
import { Response } from '..'

// If a non-root request path has trailing slashes, return a 302
// redirect with the slashes removed
//
function removeTrailingSlash () {
  const re = /([^/]+)\/+$/
  const hasSlash = s => re.test(s)
  const trimSlash = s => s.replace(re, '$1')

  return function middleware (handler) {
    return async function newHandler (request) {
      if (hasSlash(request.path)) {
        return Response.redirect(trimSlash(request.path))
      }
      return handler(request)
    }
  }
}

export default removeTrailingSlash
