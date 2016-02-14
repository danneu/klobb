
// 3rd
import test from 'ava'
// 1st
import { Response } from '../lib'
import { serve, client } from './_helpers'

test('return undefined becomes 404', async t => {
  const handler = async (request) => {
    return
  }
  const url = await serve(handler)
  const res = await client('GET', url)
  t.same(res.statusCode, 404)
})

// Response

test('new Response(), explicit 200', async t => {
  const handler = async (request) => {
    return new Response(200, {}, 'hello world')
  }
  const url = await serve(handler)
  const res = await client('GET', url)
  t.same(res.statusCode, 200)
  t.same(res.body, 'hello world')
})

test('new Response(), arbitrary response code, header, and body', async t => {
  const handler = async (request) => {
    return new Response(418, {
      'x-custom-header': 'foo'
    }, 'hello world')
  }
  const url = await serve(handler)
  const res = await client('GET', url)
  t.same(res.statusCode, 418)
  t.same(res.headers['x-custom-header'], 'foo')
  t.same(res.body, 'hello world')
})

test('Response.ok()', async t => {
  const handler = async (request) => {
    return Response.ok('hello world')
  }
  const url = await serve(handler)
  const res = await client('GET', url)
  t.same(res.statusCode, 200)
  t.same(res.body, 'hello world')
})

test('Response.notFound()', async t => {
  const handler = async (request) => {
    return Response.notFound()
  }
  const url = await serve(handler)
  const res = await client('GET', url)
  t.same(res.statusCode, 404)
})

test('Response.redirect(url) defaults to 302', async t => {
  const handler = async (request) => {
    return Response.redirect('/foo')
  }
  const url = await serve(handler)
  const res = await client('GET', url)
  t.same(res.statusCode, 302)
  t.same(res.headers.location, '/foo')
})

test('Response.redirect(url, status) overrides default status', async t => {
  const handler = async (request) => {
    return Response.redirect('/foo', 301)
  }
  const url = await serve(handler)
  const res = await client('GET', url)
  t.same(res.statusCode, 301)
  t.same(res.headers.location, '/foo')
})

// Request

test('Request has basic key/vals', async t => {
  const handler = async (request) => {
    t.same(request.url, '/test?foo=bar')
    t.same(request.method, 'GET')
    t.same(request.path, '/test')
    t.same(request.querystring, 'foo=bar')
    return
  }
  const url = await serve(handler)
  const res = await client('GET', url + '/test?foo=bar')
  t.notSame(res.statusCode, 500)
})

test('Request#query parses querystring', async t => {
  const handler = async (request) => {
    t.same(request.query, { foo: 'bar' })
    return
  }
  const url = await serve(handler)
  const res = await client('GET', url + '?foo=bar')
  t.notSame(res.statusCode, 500)
})

test('Request#query returns {} if querystring empty', async t => {
  const handler = async (request) => {
    t.same(request.query, {})
    return
  }
  const url = await serve(handler)
  const res = await client('GET', url)
  t.notSame(res.statusCode, 500)
})

test('proxy=true uses x-forwarded-for', async t => {
  const handler = async (request) => {
    t.same(request.ip, 'proxy-ip-address')
    return
  }
  const url = await serve(handler, { proxy: true })
  const res = await client('GET', url, {
    headers: { 'x-forwarded-for': 'proxy-ip-address' }
  })
  t.notSame(res.statusCode, 500)
})

test('proxy=false ignores x-forwarded-for', async t => {
  const handler = async (request) => {
    t.notSame(request.ip, 'proxy-ip-address')
    return
  }
  const url = await serve(handler)
  const res = await client('GET', url, {
    headers: { 'x-forwarded-for': 'proxy-ip-address' }
  })
  t.notSame(res.statusCode, 500)
})

// Response#finalize

test('response content-length is set with string body', async t => {
  const handler = async (request) => {
    return Response.ok('hello')
  }
  const url = await serve(handler)
  const res = await client('GET', url)
  t.same(res.statusCode, 200)
  t.same(res.headers['content-length'], '5')
})

test('response content-length is set with buffer body', async t => {
  const handler = async (request) => {
    return Response.ok(new Buffer('hello'))
  }
  const url = await serve(handler)
  const res = await client('GET', url)
  t.same(res.statusCode, 200)
  t.same(res.headers['content-length'], '5')
})

test.skip('response content-length is set with buffer body', async t => {
})

test('ignores existing content-length if it can determine the length itself', async t => {
  const handler = async (request) => {
    return new Response(200, { 'content-length': '42' }, 'hello')
  }
  const url = await serve(handler)
  const res = await client('GET', url)
  t.same(res.statusCode, 200)
  t.same(res.headers['content-length'], '5')
})
