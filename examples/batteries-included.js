
// 1st
import { Response, Batteries, compose } from '../src';
const Cookie = Batteries.Cookie;

const middleware = compose(
  Batteries.logger(),
  Batteries.notModified({ etag: true }),
  Batteries.serveStatic('public', { maxage: 1000 * 60 * 60 * 24 }),
  Batteries.jsonBodyParser(),
  Batteries.Cookie.middleware(),
  Batteries.Flash.middleware()
);

async function handler(request) {
  const views = (parseInt(Cookie.get('views', request), 10) || 0) + 1;

  return Response.ok(`You have viewed this page ${views} time(s)`)
    .tap(Cookie.set('views', views));
}

export default middleware(handler);

// serve it and check out GET / and GET /img/sleeper.jpg
