
// Node
import nodeUrl from 'url'
// 3rd
import Immutable from 'immutable'
import typeIs from 'type-is'
import accepts from 'accepts'
import R from 'ramda'

const defaults = {
  url: '',
  method: '',
  path: '',
  querystring: '',
  headers: new Immutable.Map(),
  ip: '',
  body: undefined,
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
  static fromNode (nreq, { proxy } = {}) {
    const parsed = nodeUrl.parse(nreq.url)

    return new Request({
      url: nreq.url,
      method: nreq.method,
      path: parsed.pathname,
      querystring: parsed.search || '',
      headers: nreq.headers,
      ip: proxy
        ? nreq.headers['x-forwarded-for'] || nreq.connection.remoteAddress
        : nreq.connection.remoteAddress,
      nreq: nreq
    })
  }

  constructor (opts = {}) {
    opts.headers = new Immutable.Map(opts.headers)
    super(R.reject(R.isNil, opts))
  }

  // Parses querystring on demand
  //
  // Returns object, {} if querystring is empty
  get query () {
    return nodeUrl.parse(this.querystring, true).query
  }

  // String -> Maybe String
  getHeader (key) {
    return this.getIn(['headers', key.toLowerCase()])
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

  // CONTENT NEGOTIATION

  accepts (...types) {
    const accept = accepts(this.nreq)
    return accept.type(types)
  }
}

export default Request
