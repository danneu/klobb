
// 3rd
import test from 'ava'
// 1st
import { Request } from '../../lib'
import { nreq } from '../_helpers'

// Koa: https://github.com/koajs/koa/blob/188922a0033286aff5663c65779a6ae1bca3b1a6/test/request/hostname.js

test('returns hostname without port', t => {
  const request = Request.fromNode(nreq({
    headers: { 'host': 'foo.com:3000' }
  }))
  t.same(request.hostname, 'foo.com')
})

test('when no host, returns ""', t => {
  const request = Request.fromNode(nreq())
  t.same(request.hostname, '')
})

test('when x-forwarded-host is present but proxy is not trusted, ignores x-forwarded-host', t => {
  const request = Request.fromNode(nreq({
    headers: {
      'x-forwarded-host': 'bar.com',
      'host': 'foo.com'
    }
  }), { proxy: false })
  t.same(request.hostname, 'foo.com')
})

test('when x-forwarded-host is present and proxy is trusted, uses x-forwarded-host', t => {
  const request = Request.fromNode(nreq({
    headers: {
      'x-forwarded-host': 'bar.com',
      'host': 'foo.com'
    }
  }), { proxy: true })
  t.same(request.hostname, 'bar.com')
})
