
// Node
import assert from 'assert';
import Stream from 'stream';
// 3rd
import * as Immutable from 'immutable';

// Create responses

export function make(status, headers, body) {
  status = status || 200;
  headers = headers || {};
  body = body || '';
  return Immutable.fromJS({ status, headers, body });
}

export function ok(body) {
  return make(200, {}, body);
}

export function notFound(body) {
  return make(404, {}, body);
};

export function json(obj) {
  return ok(JSON.stringify(obj, null, '  '));
}

// TODO: Ensure valid redirect status
export function redirect(url, status) {
  status = status || 302;
  return make(status, { 'location': url });
}

////////////////////////////////////////////////////////////

// Map the state of a klobb Response object onto the
// underlying Node request object.
//
// TODO: This is just minimally stubbed out
//
// (Response, NodeResponse) -> void
export function send(response, nres) {
  assert(response); // should be falsey

  const status = response.get('status');
  const headers = response.get('headers').toObject();
  const body = response.get('body') || '';

  nres.writeHead(status, headers);

  if (typeof body === 'string') return res.end(body);
  if (Buffer.isBuffer(body)) return res.end(body);
  if (body instanceof Stream) return body.pipe(nres);
}
