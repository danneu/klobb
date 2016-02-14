
// 3rd
import test from 'ava'
// 1st
import { Response } from '../../lib'
import { Request } from '../../lib'
import { nreq } from '../_helpers'
import * as belt from '../../lib/belt'

// TODO: t.regex(response.body, /^Redirecting/) .regex not a function?

test('works', t => {
  const response = Response.redirect('/foo')
  t.same(response.status, 302)
  t.same(response.getHeader('location'), '/foo')
  t.same(response.getHeader('content-type'), 'text/plain')
  t.true(/^Redirecting/.test(response.body))
})

test.skip('takes request as 2nd argument', t => {
  const request = Request.fromNode(nreq({
    headers: { 'accept': 'text/html' }
  }))
  const response = Response.redirect('/foo', request)
  t.same(response.getHeader('content-type'), 'text/html')
  t.true(/^Redirecting/.test(response.body))
})

// ACCEPTS HTML

test('returns html if request accepts it', t => {
  const request = Request.fromNode(nreq({
    headers: { 'accept': 'text/html' }
  }))
  const response = Response.redirect('/login', 302, request)
  const url = response.getHeader('location')
  t.same(response.getHeader('content-type'), 'text/html')
  t.same(response.body, 'Redirecting to <a href="' + url + '">' + url + '</a>')
})

test('escapes url in html', t => {
  const request = Request.fromNode(nreq({
    headers: { 'accept': 'text/html' }
  }))
  const response = Response.redirect('<script>', 302, request)
  const url = belt.escapeHtml(response.getHeader('location'))
  t.same(response.getHeader('content-type'), 'text/html')
  t.same(response.body, 'Redirecting to <a href="' + url + '">' + url + '</a>')
})

// TEXT/PLAIN

test('responds with text/plain if html is not accepted', t => {
  const request = Request.fromNode(nreq({
    headers: { 'accept': 'application/json' }
  }))
  const response = Response.redirect('/foo', 301, request)
  t.same(response.getHeader('content-type'), 'text/plain')
})

// INVALID STATUS

test('sets status to 302 if given status is invalid redirect', t => {
  const response = Response.redirect('/foo', 304)
  t.same(response.status, 302)
})
