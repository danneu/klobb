
// Node
import assert from 'assert';
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

// TODO: Ensure valid redirect status
export function redirect(url, status) {
  status = status || 302;
  return make(status, { 'location': url });
}

////////////////////////////////////////////////////////////

// Sync the state of a klobb Response object onto the
// underlying Node request object.
//
// TODO: This is just minimally stubbed out
//
// (Response, NodeResponse) -> void
export function mutateNode(response, nres) {
  assert(response); // should never happen

  const status = response.get('status');
  const headers = response.get('headers').toObject();
  const body = response.get('body') || '';

  nres.writeHead(status, headers);
  nres.write(body);
}
