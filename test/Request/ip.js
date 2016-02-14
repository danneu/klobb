
// 3rd
import test from 'ava'
// 1st
import { Request } from '../../lib'
import { nreq } from '../_helpers'

// Koa: https://github.com/koajs/koa/blob/188922a0033286aff5663c65779a6ae1bca3b1a6/test/request/ip.js

test('with request.ips present, returns first one', t => {
  const request = Request.fromNode(nreq({
    headers: { 'x-forwarded-for': '127.0.0.1,127.0.0.2' }
  }), { proxy: true })
  t.same(request.ip, '127.0.0.1')
})

test('with no request.ips present, returns socket.remoteAddress', t => {
  const request = Request.fromNode(nreq({
    socket: { remoteAddress: '127.0.0.2' }
  }))
  t.same(request.ip, '127.0.0.2')
})

test('with no request.ips or socket.remoteAddress present, returns ""', t => {
  const request = Request.fromNode(nreq({
    socket: { remoteAddress: undefined }
  }))
  t.same(request.ip, '')
})
