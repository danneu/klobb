
// 3rd
import test from 'ava'
// 1st
import { Request } from '../../lib'
import { nreq } from '../_helpers'

// Koa: https://github.com/koajs/koa/blob/188922a0033286aff5663c65779a6ae1bca3b1a6/test/request/acceptsCharsets.js

test('acceptCharset() without args, when Accept-Charset is populated, returns accepted types', t => {
  const request = Request.fromNode(nreq({
    headers: { 'accept-charset': 'utf-8, iso-8859-1;q=0.2, utf-7;q=0.5' }
  }))
  t.same(request.acceptsCharsets(), ['utf-8', 'utf-7', 'iso-8859-1'])
})

test('acceptCharset() with multiple args, when Accept-Charset is populated, returns accepted types if any types match', t => {
  const request = Request.fromNode(nreq({
    headers: { 'accept-charset': 'utf-8, iso-8859-1;q=0.2, utf-7;q=0.5' }
  }))
  t.same(request.acceptsCharsets('utf-7', 'utf-8'), 'utf-8')
})

test('acceptCharset() with multiple args, when Accept-Charset is populated, returns false if no types match', t => {
  const request = Request.fromNode(nreq({
    headers: { 'accept-charset': 'utf-8, iso-8859-1;q=0.2, utf-7;q=0.5' }
  }))
  t.same(request.acceptsCharsets('utf-16'), false)
})

test('acceptCharset() with multiple args, when Accept-Charset is not populated, returns first types if any types match', t => {
  const request = Request.fromNode(nreq())
  t.same(request.acceptsCharsets('utf-7', 'utf-8'), 'utf-7')
})

test('acceptCharset() with array arg returns best fit', t => {
  const request = Request.fromNode(nreq({
    headers: { 'accept-charset': 'utf-8, iso-8859-1;q=0.2, utf-7;q=0.5' }
  }))
  t.same(request.acceptsCharsets('utf-7', 'utf-8'), 'utf-8')
})
