
// Node
import nodeUrl from 'url'
// 3rd
import Immutable from 'immutable'
import typeIs from 'type-is'
import accepts from 'accepts'
import R from 'ramda'
import contentType from 'content-type'
import qs from 'qs'

const optsDefaults = {
  proxy: false
}

class Options extends Immutable.Record(optsDefaults) {
  constructor (opts = {}) {
    super(R.reject(R.isNil, opts))
  }
}

const defaults = {
  url: '',
  method: '',
  path: '',
  querystring: '',
  headers: new Immutable.Map(),
  body: undefined,
  // configuration for the request
  opts: new Options(),
  // regular js object, represents underlying Node request object
  nreq: {},
  // a place to store things that isn't part of the klobb request
  state: new Immutable.Map()
}

class Request extends Immutable.Record(defaults) {
  // Builds an immutable klobb request from an underlying
  // Node request.
  //
  // TODO: This is just minimally stubbed out
  //
  // (NodeRequest, Options) -> Request
  static fromNode (nreq, opts = {}) {
    const parsed = nodeUrl.parse(nreq.url)
    const data = {
      url: nreq.url,
      method: nreq.method,
      path: parsed.pathname,
      querystring: parsed.query || '',
      headers: nreq.headers,
      nreq: nreq,
      opts: new Options(R.reject(R.isNil, opts))
    }
    return new Request(data)
  }

  constructor (data) {
    data.headers = new Immutable.Map(data.headers)
    super(R.reject(R.isNil, data))
  }

  // Parses querystring on demand
  //
  // Returns object, {} if querystring is empty
  get query () {
    return qs.parse(this.querystring)
  }

  // String -> Maybe String
  getHeader (key) {
    key = key.toLowerCase()
    if (key === 'referrer') key = 'referer'
    return this.getIn(['headers', key])
  }

  // This useless function is only here to mirror the more necessary
  // Response#setBody.
  setBody (body) {
    return this.set('body', body)
  }

  // Uses the type-is npm module to check against the content-type
  // of the request.
  //
  // Ex:
  //
  //     if (request.typeIs('image/*')) {
  //       // process
  //     } else {
  //       throw createError(415, 'images only!');
  //     }
  //
  // ...String -> String || falsey
  typeIs (...types) {
    return typeIs(this.nreq, types)
  }

  get charset () {
    const type = this.getHeader('content-type')
    if (!type) return ''
    return contentType.parse(type).parameters.charset || ''
  }

  // String
  get host () {
    const host = this.opts.proxy
      ? this.getHeader('x-forwarded-host') || this.getHeader('host')
      : this.getHeader('host')
    if (!host) return ''
    return host.split(/\s*,\s*/)[0]
  }

  // String
  get hostname () {
    return this.host.split(':')[0]
  }

  // [String]
  get ips () {
    const val = this.getHeader('x-forwarded-for')
    return this.opts.proxy && val
      ? val.split(/\s*,\s*/)
      : []
  }

  // String
  get ip () {
    return this.ips[0] || this.nreq.socket.remoteAddress || ''
  }

  // CONTENT NEGOTIATION
  //
  // See: https://github.com/jshttp/accepts

  accepts (...types) {
    const accept = accepts(this.nreq)
    if (R.head(types) === undefined) return accept.types()
    return accept.type(R.flatten(types))
  }

  acceptsCharsets (...types) {
    const accept = accepts(this.nreq)
    if (R.head(types) === undefined) return accept.charsets()
    return accept.charset(R.flatten(types))
  }

  acceptsEncodings (...types) {
    const accept = accepts(this.nreq)
    if (R.head(types) === undefined) return accept.encodings()
    return accept.encoding(R.flatten(types))
  }

  acceptsLanguages (...types) {
    const accept = accepts(this.nreq)
    if (R.head(types) === undefined) return accept.languages()
    return accept.language(R.flatten(types))
  }

  // HELPERS

  inspect () {
    return JSON.stringify(this.remove('nreq'), null, '  ')
  }
}

export default Request
