
// 3rd
import test from 'ava'
// 1st
import { Request } from '../../lib'
import { nreq } from '../_helpers'

// Koa: https://github.com/koajs/koa/blob/188922a0033286aff5663c65779a6ae1bca3b1a6/test/request/acceptsEncodings.js

test('without args, when Accept-Encoding is populated, returns accepted types', t => {
  const request = Request.fromNode(nreq({
    headers: { 'accept-encoding': 'gzip, compress;q=0.2' }
  }))
  t.same(request.acceptsEncodings(), ['gzip', 'compress', 'identity'])
  t.same(request.acceptsEncodings('gzip', 'compress'), 'gzip')
})

test('with multiple args, returns best fit', t => {
  const request = Request.fromNode(nreq({
    headers: { 'accept-encoding': 'gzip, compress;q=0.2' }
  }))
  t.same(request.acceptsEncodings('gzip', 'compress'), 'gzip')
  t.same(request.acceptsEncodings('compress', 'gzip'), 'gzip')
})

test('with array arg, returns best fit', t => {
  const request = Request.fromNode(nreq({
    headers: { 'accept-encoding': 'gzip, compress;q=0.2' }
  }))
  t.same(request.acceptsEncodings(['gzip', 'compress']), 'gzip')
  t.same(request.acceptsEncodings(['compress', 'gzip']), 'gzip')
})
