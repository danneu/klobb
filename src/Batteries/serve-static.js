
// Node
import nodePath from 'path'
import fs from 'fs'
// 3rd
import resolvePath from 'resolve-path'
import mime from 'mime-types'
import R from 'ramda'
// 1st
import { Response, createError } from '..'

// - `root` is the directory we're serving from. request path lookups
//   are always inside this root. malicious paths (like '../../secrets.txt')
//   return a 400 response.
// - `opts`:
//     - maxage (default: 0)
//         Tell clients to cache for milliseconds
//
// Example:
//
//    serveStatic('.')
//    serveStatic('../../assets')
//    serveStatic('public', { maxage: 1000 * 60 * 60 })
//
// (String, Options) -> Middleware
export default function serveStatic (root, { maxage: maxage = 0 } = {}) {
  // Turns root into absolute path
  root = nodePath.resolve(root)

  return function middleware (handler) {
    return async function newHandler (request) {
      // Bail if not HEAD or GET
      if (!R.contains(request.method, ['HEAD', 'GET'])) {
        return handler(request)
      }

      // Note: First remove the leading slash of request.path
      const lookupPath = resolvePath(root, request.path.substr(1))

      let stats
      try {
        stats = await stat(lookupPath)
      } catch (err) {
        // errCodes: 'ENOENT', 'ENAMETOOLONG', 'ENOTDIR'
        // Continue if file simple wasn't found
        if (err.code === 'ENOENT') {
          return handler(request)
        }
        // The other err codes are internal errors
        throw createError(500, err)
      }

      // Only serve files
      if (!stats.isFile()) {
        return handler(request)
      };

      // File was found
      return Response.ok()
        .setHeader('last-modified', stats.mtime.toUTCString())
        .setHeader('content-length', stats.size)
        .setHeader('cache-control', `max-age=${Math.floor(maxage / 1000)}`)
        .setHeader('content-type', mime.lookup(lookupPath))
        .setBody(fs.createReadStream(lookupPath), stats)
    }
  }
}

function stat (path) {
  return new Promise(function (resolve, reject) {
    fs.stat(path, function (err, data) {
      if (err) return reject(err)
      resolve(data)
    })
  })
}
