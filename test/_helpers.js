
// 3rd
import rp from 'request-promise'
import R from 'ramda'
// 1st
import * as klobb from '../lib'

export function client (method, url, optsOverride = {}) {
  const opts = Object.assign({}, {
    simple: false,
    resolveWithFullResponse: true,
    followRedirect: false,
    uri: url,
    method: method
  }, optsOverride)
  return rp(opts)
}

export async function serve (handler, opts = {}) {
  const server = klobb.serve(handler, opts)
  return new Promise((resolve, reject) => {
    server.listen(err => {
      if (err) return reject(err)
      resolve(`http://localhost:${server.address().port}`)
    })
  })
}

export function nreq (opts = {}) {
  return R.merge({
    url: '/',
    method: 'GET',
    headers: {},
    connection: { remoteAddress: '127.0.0.1' },
    socket: { remoteAddress: '127.0.0.1' }
  }, opts)
}
