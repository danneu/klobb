
// 3rd
import test from 'ava'
// 1st
import { Request } from '../../lib'
import { nreq } from '../_helpers'

// Koa: https://github.com/koajs/koa/blob/188922a0033286aff5663c65779a6ae1bca3b1a6/test/request/is.js
// - NOTE: Made some API changes from Koa's Request#is

test('when called with no args, returns false', t => {
  const request = Request.fromNode(nreq())
  t.same(request.checkType(), false)
})

test('when request has no body, returns false', t => {
  const request = Request.fromNode(nreq())
  t.same(request.checkType('html'), false)
})

test('when given one type', t => {
  const request = Request.fromNode(nreq({
    headers: {
      'content-type': 'image/png',
       // transfer-encoding is needed to make type-is thing there's body
      'transfer-encoding': 'chunked'
    }
  }))
  t.same(request.checkType('png'), 'png')
  t.same(request.checkType('.png'), '.png')
  t.same(request.checkType('image/png'), 'image/png')
  t.same(request.checkType('image/*'), 'image/png')
  t.same(request.checkType('*/png'), 'image/png')

  t.same(request.checkType('jpeg'), false)
  t.same(request.checkType('.jpeg'), false)
  t.same(request.checkType('image/jpeg'), false)
  t.same(request.checkType('text/*'), false)
  t.same(request.checkType('*/jpeg'), false)
})

test('when given multiple types, should return first match or false', t => {
  const request = Request.fromNode(nreq({
    headers: {
      'content-type': 'image/png',
       // transfer-encoding is needed to make type-is thing there's body
      'transfer-encoding': 'chunked'
    }
  }))
  t.same(request.checkType('text/*', 'image/*'), 'image/png')
  t.same(request.checkType('image/*', 'text/*'), 'image/png')
  t.same(request.checkType('image/*', 'image/png'), 'image/png')
  t.same(request.checkType('image/png', 'image/*'), 'image/png')

  t.same(request.checkType(['text/*', 'image/*']), 'image/png')
  t.same(request.checkType(['image/*', 'text/*']), 'image/png')
  t.same(request.checkType(['image/*', 'image/png']), 'image/png')
  t.same(request.checkType(['image/png', 'image/*']), 'image/png')

  t.same(request.checkType('text/*', 'application/*'), false)
  t.same(request.checkType(['text/*', 'application/*']), false)
})

test('when content-type: application/x-www-form-urlencoded, it should match "urlencoded"', t => {
  const request = Request.fromNode(nreq({
    headers: {
      'content-type': 'application/x-www-form-urlencoded',
       // transfer-encoding is needed to make type-is thing there's body
      'transfer-encoding': 'chunked'
    }
  }))
  t.same(request.checkType('urlencoded'), 'urlencoded')
  t.same(request.checkType('json', 'urlencoded'), 'urlencoded')
  t.same(request.checkType('urlencoded', 'json'), 'urlencoded')
})
