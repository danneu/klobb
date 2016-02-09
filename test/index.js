
// 3rd
import test from 'ava';
// 1st
import { Request, Response, Middleware } from '../lib';
import { serve, client } from './_helpers';

test('return undefined becomes 404', async t => {
  const handler = async (request) => {
    return;
  };
  const url = await serve(handler);
  const res = await client('GET', url);
  t.same(res.statusCode, 404);
});

// Response

test('Response.make(), explicit 200', async t => {
  const handler = async (request) => {
    return Response.make(200, {}, 'hello world');
  };
  const url = await serve(handler);
  const res = await client('GET', url);
  t.same(res.statusCode, 200);
  t.same(res.body, 'hello world');
});

test('Response.make(), arbitrary response code, header, and body', async t => {
  const handler = async (request) => {
    return Response.make(418, {
      'x-custom-header': 'foo'
    }, 'hello world');
  };
  const url = await serve(handler);
  const res = await client('GET', url);
  t.same(res.statusCode, 418);
  t.same(res.headers['x-custom-header'], 'foo');
  t.same(res.body, 'hello world');
});

test('Response.ok()', async t => {
  const handler = async (request) => {
    return Response.ok('hello world');
  };
  const url = await serve(handler);
  const res = await client('GET', url);
  t.same(res.statusCode, 200);
  t.same(res.body, 'hello world');
});

test('Response.notFound()', async t => {
  const handler = async (request) => {
    return Response.notFound();
  };
  const url = await serve(handler);
  const res = await client('GET', url);
  t.same(res.statusCode, 404);
});

test('Response.redirect(url) defaults to 302', async t => {
  const handler = async (request) => {
    return Response.redirect('/foo');
  };
  const url = await serve(handler);
  const res = await client('GET', url);
  t.same(res.statusCode, 302);
  t.same(res.headers.location, '/foo');
});

test('Response.redirect(url, status) overrides default status', async t => {
  const handler = async (request) => {
    return Response.redirect('/foo', 301);
  };
  const url = await serve(handler);
  const res = await client('GET', url);
  t.same(res.statusCode, 301);
  t.same(res.headers.location, '/foo');
});

// Request

test('Request has basic key/vals', async t => {
  const handler = async (request) => {
    t.same(request.get('url'), '/test?foo=bar');
    t.same(request.get('method'), 'GET');
    t.same(request.get('path'), '/test');
    t.same(request.get('querystring'), '?foo=bar');
    return;
  };
  const url = await serve(handler);
  const res = await client('GET', url + '/test?foo=bar');
  t.notSame(res.statusCode, 500);
});

test('Request.query parses querystring', async t => {
  const handler = async (request) => {
    t.same(Request.query(request), { foo: 'bar' });
    return;
  };
  const url = await serve(handler);
  const res = await client('GET', url + '?foo=bar');
  t.notSame(res.statusCode, 500);
});

test('Request.query returns {} if querystring empty', async t => {
  const handler = async (request) => {
    t.same(Request.query(request), {});
    return;
  };
  const url = await serve(handler);
  const res = await client('GET', url);
  t.notSame(res.statusCode, 500);
});

test('proxy=true uses x-forwarded-for', async t => {
  const handler = async (request) => {
    t.same(request.get('ip'), 'proxy-ip-address');
    return;
  };
  const url = await serve(handler, { proxy: true });
  const res = await client('GET', url, {
    headers: { 'x-forwarded-for': 'proxy-ip-address' }
  });
  t.notSame(res.statusCode, 500);
});

test('proxy=false ignores x-forwarded-for', async t => {
  const handler = async (request) => {
    t.notSame(request.get('ip'), 'proxy-ip-address');
    return;
  };
  const url = await serve(handler);
  const res = await client('GET', url, {
    headers: { 'x-forwarded-for': 'proxy-ip-address' }
  });
  t.notSame(res.statusCode, 500);
});