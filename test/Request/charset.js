
// 3rd
import test from 'ava'
// 1st
import { Request } from '../../lib'
import { nreq } from '../_helpers'

// Koa: https://github.com/koajs/koa/blob/188922a0033286aff5663c65779a6ae1bca3b1a6/test/request/charset.js

test('with no content-type present, returns ""', t => {
  const request = Request.fromNode(nreq())
  t.same(request.charset, '')
})

test('with content-type present but no charset, returns ""', t => {
  const request = Request.fromNode(nreq({
    headers: { 'content-type': 'text/plain' }
  }))
  t.same(request.charset, '')
})

test('with content-type and a charset present, returns charset', t => {
  const request = Request.fromNode(nreq({
    headers: { 'content-type': 'text/plain; charset=iso-8859-4' }
  }))
  t.same(request.charset, 'iso-8859-4')
})
