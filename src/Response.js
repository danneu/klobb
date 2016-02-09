
// Node
import Stream from 'stream';
// 3rd
import Immutable from 'immutable';

const defaults = {
  status: 200,
  headers: new Immutable.Map(),
  body: ''
};

class Response extends Immutable.Record(defaults) {
  static make(status, headers, body) {
    return new Response(status, headers, body);
  }

  static notFound() {
    return new Response(404, {}, 'Not Found');
  }

  static ok(body) {
    return new Response(200, {}, body);
  }

  static redirect(url, status) {
    status = status || 302;
    return new Response(status, { 'location': url });
  }

  // Map the state of a klobb Response object onto the
  // underlying Node request object.
  //
  // TODO: This is just minimally stubbed out
  //
  // (Response, NodeResponse) -> void
  static send(response, nres) {
    response = response.finalize(); // Should probably do this in outer middleware

    const status = response.status;
    const headers = response.headers.toObject();
    const body = response.body;

    nres.writeHead(status, headers);

    if (typeof body === 'string') return nres.end(body);
    if (Buffer.isBuffer(body)) return nres.end(body);
    if (body instanceof Stream) return body.pipe(nres);
  }

  constructor(status, headers, body) {
    // Handle plain object headers
    if (headers !== undefined && !Immutable.Map.isMap(headers)) {
      headers = new Immutable.Map(headers);
    }
    // Create an object that doesn't have undefined keys so we can lean on
    // our Immutable.Record defaults
    let opts = {};
    if (status !== undefined) opts.status = status;
    if (headers !== undefined) opts.headers = headers;
    if (body !== undefined) opts.body = body;

    super(opts);
  }

  // Calculates final headers to be sent based on the state of the request
  //
  // Returns new request that's ready to be used with Response.send.
  finalize() {
    const body = this.body || '';

    // Determine content-length
    let length;
    if (typeof body === 'string')
      length = Buffer.byteLength(body);
    else if (Buffer.isBuffer(body)) 
      length = Buffer.byteLength(body);
    else
      length = this.getHeader('content-length');

    return this.setHeader('content-length', length);
  }

  // Does not set the header if val is undefined/null
  //
  // (String, any) -> Response
  setHeader(key, val) {
    if (val === undefined || val === null) return this;
    return this.setIn(['headers', key.toLowerCase()], val);
  }

  // String -> Maybe String
  getHeader(key) {
    return this.getIn(['headers', key.toLowerCase()]);
  }
}

export default Response;
