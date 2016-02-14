
// 3rd
import test from 'ava'
// 1st
import { Request } from '../../lib'
import { nreq } from '../_helpers'

// Koa: https://github.com/koajs/koa/blob/188922a0033286aff5663c65779a6ae1bca3b1a6/test/request/host.js

test('should return host with port', t => {
  const request = Request.fromNode(nreq({
    headers: { 'host': 'foo.com:3000' }
  }))
  t.same(request.host, 'foo.com:3000')
})

test('when x-forwarded-host is present, and proxy is not trusted', t => {
  const request = Request.fromNode(nreq({
    headers: {
      'x-forarded-host': 'bar.com',
      'host': 'foo.com'
    }
  }), { proxy: false })
  t.same(request.host, 'foo.com')
})

test('when x-forwarded-host is present, and proxy is trusted', t => {
  const request = Request.fromNode(nreq({
    headers: {
      'x-forwarded-host': 'bar.com',
      'host': 'foo.com'
    }
  }), { proxy: true })
  t.same(request.host, 'bar.com')
})
