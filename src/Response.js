
// Node
import Stream from 'stream';
// 3rd
import Immutable from 'immutable';
import R from 'ramda';
import mime from 'mime-types';

const defaults = {
  status: 200,
  headers: new Immutable.Map(),
  body: '',
  state: new Immutable.Map(),
};

class Response extends Immutable.Record(defaults) {
  static make(status, headers, body) {
    return new Response(status, headers, body);
  }

  static notFound() {
    return new Response(404, {}, 'Not Found');
  }

  static notModified() {
    return new Response(304, { 'content-length': 0 });
  }

  static ok(body) {
    return new Response(200, {}, body);
  }

  static json(obj) {
    const body = JSON.stringify(obj, null, '  ');
    return new Response(200, { 'content-type': 'application/json' }, body);
  }

  static redirect(url, status) {
    status = status || 302;
    return new Response(status, { 'location': url });
  }

  // Request, Maybe String -> Response
  static redirectBack(request, altUrl) {
    const url = request.getHeader('referrer') || altUrl || '/';
    return new Response(302, { 'location': url });
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
    const headers = response.headers.toJS();
    const body = response.body;

    nres.writeHead(status, headers);

    if (typeof body === 'string') return nres.end(body);
    if (Buffer.isBuffer(body)) return nres.end(body);
    if (body instanceof Stream) return body.pipe(nres);
    nres.end(body);
  }

  constructor(status, headers, body) {
    // Create an object that doesn't have undefined keys so we can lean on
    // our Immutable.Record defaults
    const opts = R.reject(R.isNil, { status, headers, body });
    // Handle plain objects
    if (opts.headers) opts.headers = Immutable.Map(opts.headers)

    super(opts);
  }

  // Calculates final headers to be sent based on the state of the request
  //
  // Returns new request that's ready to be used with Response.send.
  finalize() {
    // Don't use `this` past this point. We're accumulating
    // the final response representation.
    let finalResponse = this;

    // Determine content-length
    let length;
    if (typeof finalResponse.body === 'string')
      length = Buffer.byteLength(finalResponse.body);
    else if (Buffer.isBuffer(finalResponse.body))
      length = Buffer.byteLength(finalResponse.body);
    else
      length = finalResponse.getHeader('content-length');

    // Determine full content-type
    // Ex: mime.contentType('text/plain') -> 'text/plain; chartset=utf-8'
    let type;
    if (typeof finalResponse.getHeader('content-type') === 'string') {
      // mime.contentType returns false if it can't discern,
      // so turn it into undefined
      type = mime.contentType(finalResponse.getHeader('content-type')) || undefined;
    }

    return finalResponse
      .setHeader('content-length', length)
      .setHeader('content-type', type);
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

  // Use this function to update the body so that it can maintain the optional
  // fs.Stats object, which can be used for etag caching.
  //
  // (Stream, fs.StatsObject) -> Response
  setBody(body, stats) {
    if (stats) body._stats = stats; // lame
    return this.set('body', body);
  }

  // Chaining convenience
  //
  // Request.ok().tap(doSomething1).tap(doSomething2)
  //
  // (Response -> Response)
  tap(f) {
    return f(this);
  }
}

export default Response;
