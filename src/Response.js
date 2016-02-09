
// 3rd
import Immutable from 'immutable';

const defaults = {
  status: 200,
  headers: new Immutable.Map(),
  body: ''
};

class Response extends Immutable.Record(defaults) {
  static notFound() {
    return new Response(404, {}, 'Not Found');
  }

  static ok(body) {
    return new Response(200, {}, body);
  }

  // TODO: Ensure valid redirect status
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
    const status = response.status;
    const headers = response.headers.toObject();
    const body = response.body || '';

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

  setHeader(key, val) {
    return this.setIn(['headers', key.toLowerCase()], val);
  }
}

export default Response;
