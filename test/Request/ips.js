
// 3rd
import test from 'ava'
// 1st
import { Request } from '../../lib'
import { nreq } from '../_helpers'

// Koa: https://github.com/koajs/koa/blob/188922a0033286aff5663c65779a6ae1bca3b1a6/test/request/ips.js

test('when x-forwarded-for is present but proxy is not trusted, ignore x-forwarded-for', t => {
  const request = Request.fromNode(nreq({
    headers: { 'x-forwarded-for': '127.0.0.1,127.0.0.2' }
  }))
  t.same(request.ips, [])
})

test('when x-forwarded-for is present and proxy is trusted, use x-forwarded-for', t => {
  const request = Request.fromNode(nreq({
    headers: { 'x-forwarded-for': '127.0.0.1,127.0.0.2' }
  }), { proxy: true })
  t.same(request.ips, ['127.0.0.1', '127.0.0.2'])
})
