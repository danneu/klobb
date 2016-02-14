
// 3rd
import test from 'ava'
// 1st
import { Request } from '../../lib'
import { nreq } from '../_helpers'

// Koa: https://github.com/koajs/koa/blob/188922a0033286aff5663c65779a6ae1bca3b1a6/test/request/accepts.js

test('[Accept populated] accepts() without args should return all Accept types', t => {
  const request = Request.fromNode(nreq({
    headers: {
      'accept': 'application/*;q=0.2, image/jpeg;q=0.8, text/html, text/plain'
    }
  }))
  t.same(request.accepts(), ['text/html', 'text/plain', 'image/jpeg', 'application/*'])
})

test('[Accept populated] accepts() with non-matching args should return false', t => {
  const request = Request.fromNode(nreq({
    headers: {
      'accept': 'application/*;q=0.2, image/jpeg;q=0.8, text/html, text/plain'
    }
  }))
  t.same(request.accepts('image/png', 'image/tiff'), false)
})

test('[Accept NOT populated] accepts(...types) should return first type', t => {
  const request = Request.fromNode(nreq())
  t.same(request.accepts('text/html', 'text/plain', 'image/jpeg', 'application/*'), 'text/html')
})

test('when extensions given, should convert to mime types', t => {
  const request = Request.fromNode(nreq({
    headers: { 'accept': 'text/plain, text/html' }
  }))
  t.same(request.accepts('html'), 'html')
  t.same(request.accepts('.html'), '.html')
  t.same(request.accepts('txt'), 'txt')
  t.same(request.accepts('.txt'), '.txt')
  t.same(request.accepts('png'), false)
})

test('when array given, should return first match', t => {
  const request = Request.fromNode(nreq({
    headers: { 'accept': 'text/plain, text/html' }
  }))
  t.same(request.accepts(['png', 'text', 'html']), 'text')
  t.same(request.accepts(['png', 'html']), 'html')
})

test('when multiple args given, should return first match', t => {
  const request = Request.fromNode(nreq({
    headers: { 'accept': 'text/plain, text/html' }
  }))
  t.same(request.accepts('png', 'text', 'html'), 'text')
  t.same(request.accepts('png', 'html'), 'html')
})

test('when present in Accept as exact match, returns the type', t => {
  const request = Request.fromNode(nreq({
    headers: { 'accept': 'text/plain, text/html' }
  }))
  t.same(request.accepts('text/html'), 'text/html')
  t.same(request.accepts('text/plain'), 'text/plain')
})

test('when present in Accept as type match, returns the type', t => {
  const request = Request.fromNode(nreq({
    headers: { 'accept': 'application/json, */*' }
  }))
  t.same(request.accepts('text/html'), 'text/html')
  t.same(request.accepts('text/plain'), 'text/plain')
  t.same(request.accepts('image/png'), 'image/png')
})

test('when present in Accept as subtype match, returns the type', t => {
  const request = Request.fromNode(nreq({
    headers: { 'accept': 'application/json, text/*' }
  }))
  t.same(request.accepts('text/html'), 'text/html')
  t.same(request.accepts('text/plain'), 'text/plain')
  t.same(request.accepts('image/png'), false)
})
