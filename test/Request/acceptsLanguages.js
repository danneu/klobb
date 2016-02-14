
// 3rd
import test from 'ava'
// 1st
import { Request } from '../../lib'
import { nreq } from '../_helpers'

// Koa: https://github.com/koajs/koa/blob/188922a0033286aff5663c65779a6ae1bca3b1a6/test/request/acceptsLanguages.js

test('without args, when Accept-Language is populated, returns accepted types', t => {
  const request = Request.fromNode(nreq({
    headers: { 'accept-language': 'en;q=0.8, es, pt' }
  }))
  t.same(request.acceptsLanguages(), ['es', 'pt', 'en'])
})

test('with multiple args, when Accept-Language is populated, returns best fit', t => {
  const request = Request.fromNode(nreq({
    headers: { 'accept-language': 'en;q=0.8, es, pt' }
  }))
  t.same(request.acceptsLanguages('es', 'en'), 'es')
})

test('with multiple args, when Accept-Language is populated, if no types match, returns false', t => {
  const request = Request.fromNode(nreq({
    headers: { 'accept-language': 'en;q=0.8, es, pt' }
  }))
  t.same(request.acceptsLanguages('fr', 'au'), false)
})

test('with multiple args, when Accept-Language is not populated,returns first type', t => {
  const request = Request.fromNode(nreq())
  t.same(request.acceptsLanguages('es', 'en'), 'es')
})

test('with array arg, returns best fit', t => {
  const request = Request.fromNode(nreq({
    headers: { 'accept-language': 'en;q=0.8, es, pt' }
  }))
  t.same(request.acceptsLanguages(['es', 'en']), 'es')
})
