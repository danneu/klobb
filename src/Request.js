
// Node
import nodeUrl from 'url';
// 3rd 
import Immutable from 'immutable';

// Parses querystring on demand
//
// Returns object, {} if querystring is empty
export function query(request) {
  return nodeUrl.parse(request.get('querystring'), true).query;
}

// Creates a klobb Request from a Node request.
//
// TODO: Finish stubbing this out
//
// NodeRequest -> Request
export function fromNode(nreq, { proxy } = {}) {
  const parsed = nodeUrl.parse(nreq.url);

  const map = Immutable.fromJS({ 
    url: nreq.url,
    method: nreq.method,
    path: parsed.pathname,
    querystring: parsed.search || '',
    headers: nreq.headers,
    ip: proxy 
      ? nreq.headers['x-forwarded-for'] || nreq.connection.remoteAddress
      : nreq.connection.remoteAddress,
  });

  // The nreq is assoc'd down here because we don't want to .fromJS()
  // the nreq object since it's not something we ever change.
  // TODO: Don't make a persistent change just to assoc this nreq.
  //       - Look up .withMutable or something.
  return map.set('nreq', nreq);
}
