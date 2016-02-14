
// Node
import Stream from 'stream'
import assert from 'assert'
// 3rd
import Immutable from 'immutable'
import R from 'ramda'
import mime from 'mime-types'
// 1st
import Request from './Request'

const defaults = {
  status: 200,
  headers: new Immutable.Map(),
  body: '',
  state: new Immutable.Map()
}

class Response extends Immutable.Record(defaults) {

  // CONSTRUCTORS

  static make (status, headers, body) {
    return new Response(status, headers, body)
  }

  static notFound () {
    return new Response(404, {}, 'Not Found')
  }

  static notModified () {
    return new Response(304, { 'content-length': 0 })
  }

  static ok (body) {
    return new Response(200, {}, body)
  }

  static json (obj) {
    return new Response(200).json(obj)
  }

  static redirect (url, status = 302) {
    assert(typeof url === 'string')
    assert(Number.isInteger(status))

    return new Response(status, { 'location': url })
  }

  static redirectBack (request, altUrl = '/') {
    assert(request instanceof Request)
    assert(typeof altUrl === 'string')

    const url = request.getHeader('referrer') || altUrl
    return new Response(302, { 'location': url })
  }

  // Map the state of a klobb Response object onto the
  // underlying Node request object.
  //
  // TODO: This is just minimally stubbed out
  //
  // (Response, NodeResponse) -> void
  static send (response, nres) {
    response = response.finalize() // Should probably do this in outer middleware

    const status = response.status
    const headers = response.headers.toJS()
    const body = response.body

    nres.writeHead(status, headers)

    if (typeof body === 'string') return nres.end(body)
    if (Buffer.isBuffer(body)) return nres.end(body)
    if (body instanceof Stream) return body.pipe(nres)
    nres.end(body)
  }

  constructor (status, headers, body) {
    // Create an object that doesn't have undefined keys so we can lean on
    // our Immutable.Record defaults
    const opts = R.reject(R.isNil, { status, headers, body })
    // Handle plain objects
    if (opts.headers) opts.headers = Immutable.Map(opts.headers)

    super(opts)
  }

  // INSTANCE METHODS

  // Calculates final headers to be sent based on the state of the request
  // Returns new request that's ready to be used with Response.send.
  finalize () {
    // Determine body
    // Strip body for non-content status codes
    let body = this.body
    if (R.contains(this.status, [204, 205, 304])) {
      body = ''
    }

    // Determine content-length
    let length
    if (typeof body === 'string') {
      length = Buffer.byteLength(body)
    } else if (Buffer.isBuffer(body)) {
      length = Buffer.byteLength(body)
    } else {
      length = this.getHeader('content-length')
    }

    // Determine full content-type
    // Ex: mime.contentType('text/plain') -> 'text/plain; chartset=utf-8'
    let type
    if (R.contains(this.status, [204, 205, 304])) {
      type = undefined
    } else if (typeof this.getHeader('content-type') === 'string') {
      // mime.contentType returns false if it can't discern,
      // so turn it into undefined
      type = mime.contentType(this.getHeader('content-type')) || undefined
    }

    let transferEncoding = this.getHeader('transfer-encoding')
    if (R.contains(this.status, [204, 205, 304])) {
      transferEncoding = undefined
    }

    return this
      .setBody(body)
      .setHeaders({
        'content-length': length,
        'content-type': type,
        'transfer-encoding': transferEncoding
      })
  }

  // If val is nil, then the header gets removed
  // Coerces val to string
  //
  // (String, any) -> Response
  setHeader (key, val) {
    assert(typeof key === 'string')

    key = key.toLowerCase()
    if (R.isNil(val)) return this.deleteIn(['headers', key])
    if (val instanceof Array) {
      return this.setIn(['headers', key], val.map(String))
    }
    return this.setIn(['headers', key], String(val))
  }

  // Ex: setHeaders({ 'content-type': 'this', 'x-header': 'that' })
  //
  // Object -> Response
  setHeaders (obj) {
    // coerce vals to strings unless they are nil
    obj = R.map(v => {
      if (R.isNil(v)) return v
      if (v instanceof Array) return v.map(String)
      return String(v)
    }, obj)
    return this.mergeDeep({ headers: obj })
  }

  // Ex
  // appendHeader('set-cookie', 'val')
  // appendHeader('set-cookie', ['val1', 'val2'])
  //
  // (String, String) -> Response
  // (String, [String]) -> Response
  appendHeader (key, vals) {
    if (typeof vals === 'string') {
      vals = R.of(vals)
    }
    return this.updateIn(['headers', key], (current) => {
      current = typeof current === 'string'
        ? [current]
        : (R.isNil(current) ? [] : current)
      return (Immutable.List(current)).withMutations((list) => {
        for (const v of R.reject(R.isNil, vals)) {
          list.push(v)
        }
      })
    })
  }

  // String -> Maybe String
  getHeader (key) {
    assert(typeof key === 'string')
    return this.getIn(['headers', key.toLowerCase()])
  }

  setStatus (status) {
    assert(Number.isInteger(status))
    return this.set('status', status)
  }

  // Use this function to update the body so that it can maintain the optional
  // fs.Stats object, which can be used for etag caching.
  //
  // (Stream, fs.StatsObject) -> Response
  setBody (body, stats) {
    if (stats) body._stats = stats // lame
    return this.set('body', body)
  }

  json (obj) {
    const body = JSON.stringify(obj, null, '  ')
    return this.setBody(body)
      .setHeader('content-type', 'application/json')
  }

  // Chaining convenience
  // Ex: Request.ok().tap(doSomething1).tap(doSomething2) => Request
  //
  // (Response -> Response)
  tap (f) {
    assert(typeof f === 'function')
    return f(this)
  }
}

export default Response
