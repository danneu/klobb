
// 3rd
import test from 'ava';
import Immutable from 'immutable';
// 1st
import { Batteries, Request, Response, Middleware } from '../lib';
import { serve, client } from './_helpers';
import router, { intoSegments } from '../lib/Batteries/router';

test('intoSegments', t => {
  t.same(intoSegments('/'), ['/']);
  t.same(intoSegments('/a'), ['/', '/a']);
  t.same(intoSegments('/a/'), ['/', '/a']);
})

const toyRequest = (method, path) => new Request({
  url: path || '/',
  path: path || '/',
  method: method || 'GET',
  headers: {},
  status: Immutable.Map(),
});

test('empty router just 404s', t => {
  t.same(router()(toyRequest()).status, 404);
  t.same(router({})(toyRequest()).status, 404);
});

test('works', async t => {
  const handler = router({
    '/': {
      GET: () => Response.ok(),
      DELETE: () => Response.ok(),
    }
  });
  {
    const response = await handler(toyRequest('GET', '/'));
    t.same(response.status, 200);
  }
  {
    const response = await handler(toyRequest('DELETE', '/'));
    t.same(response.status, 200);
  }
  {
    const response = await handler(toyRequest('GET', '/foo'));
    t.same(response.status, 404);
  }
  {
    const response = await handler(toyRequest('POST', '/'));
    t.same(response.status, 404);
  }
});

test('basic params', async t => {
  const handler = router({
    '/': {
      '/:a': {
        GET: (request) => { 
          t.same(request.getIn(['state', 'params']).toJS(), { a: 'foo' });
          return Response.ok()
        },
      }
    }
  });
  {
    const response = await handler(toyRequest('GET', '/foo'));
    t.same(response.status, 200);
  }
});

test('deep params', async t => {
  const route = (request) => {
    t.same(request.getIn(['state', 'params']).toJS(), {
      a: '1', b: '2', c: '3', d: '4'
    });
    return Response.ok()
  }
  const handler = router({
    '/': { '/:a': { '/:b': { '/:c': { '/:d': { GET: route } } } } }
  });
  {
    const response = await handler(toyRequest('GET', '/1/2/3/4'));
    t.same(response.status, 200);
  }
  {
    const response = await handler(toyRequest('POST', '/1/2/3/4'));
    t.same(response.status, 404);
  }
  {
    const response = await handler(toyRequest('POST', '/1/2/3'));
    t.same(response.status, 404);
  }
});
