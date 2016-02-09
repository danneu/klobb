
// Node
import nodeUrl from 'url';
// 3rd 
import Immutable from 'immutable';

const defaults = {
  url: '',
  method: '',
  path: '',
  querystring: '',
  headers: new Immutable.Map(),
  ip: '',
  // regular js object, represents underlying Node request object
  nreq: {}
};

class Request extends Immutable.Record(defaults) {

  // Builds an immutable klobb request from an underlying
  // Node request.
  //
  // TODO: This is just minimally stubbed out
  //
  // (NodeRequest, Options) -> Request
  static fromNode(nreq, { proxy } = {}) {
    const parsed = nodeUrl.parse(nreq.url);

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
    });
  }

  constructor(opts = {}) {
    super(opts);
  }

  // Parses querystring on demand
  //
  // Returns object, {} if querystring is empty
  get query() {
    return nodeUrl.parse(this.querystring, true).query;
  }

  // String -> Maybe String
  getHeader(key) {
    return this.getIn(['headers', key.toLowerCase()]);
  }
}

export default Request;
