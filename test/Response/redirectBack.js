
// 3rd
import test from 'ava'
// 1st
import { Response } from '../../lib'
import { Request } from '../../lib'
import { nreq } from '../_helpers'

test('redirects according to request referrer', t => {
  const request = Request.fromNode(nreq({ headers: { referer: '/login' } }))
  const response = Response.redirectBack(request)
  t.same(response.getHeader('location'), '/login')
})

test('status is 302', t => {
  const request = Request.fromNode(nreq())
  const response = Response.redirectBack(request)
  t.same(response.status, 302)
})

test('can set alternate url if request referer nonexistent', t => {
  const request = Request.fromNode(nreq())
  const response = Response.redirectBack('/alt', request)
  t.same(response.getHeader('location'), '/alt')
})

test('request referer overrules alternate url', t => {
  const request = Request.fromNode(nreq({ headers: { referer: '/login' } }))
  const response = Response.redirectBack('/alt', request)
  t.same(response.getHeader('location'), '/login')
})

test('location ultimately defaults to "/"', t => {
  const request = Request.fromNode(nreq())
  const response = Response.redirectBack(request)
  t.same(response.getHeader('location'), '/')
})
