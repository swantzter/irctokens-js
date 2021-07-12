/* eslint-env mocha */
import assert from 'assert'
import { hostmask, tokenise } from '../src'

describe('Hostmask', () => {
  it('Should parse n!u@h', () => {
    const hm = hostmask('nick!user@host')
    assert.strictEqual(hm.nickname, 'nick')
    assert.strictEqual(hm.username, 'user')
    assert.strictEqual(hm.hostname, 'host')
  })

  it('Should parse n!u', () => {
    const hm = hostmask('nick!user')
    assert.strictEqual(hm.nickname, 'nick')
    assert.strictEqual(hm.username, 'user')
    assert.strictEqual(hm.hostname, undefined)
  })

  it('Should parse n@h', () => {
    const hm = hostmask('nick@host')
    assert.strictEqual(hm.nickname, 'nick')
    assert.strictEqual(hm.username, undefined)
    assert.strictEqual(hm.hostname, 'host')
  })

  it('Should parse n', () => {
    const hm = hostmask('nick')
    assert.strictEqual(hm.nickname, 'nick')
    assert.strictEqual(hm.username, undefined)
    assert.strictEqual(hm.hostname, undefined)
  })

  it('Should be parsed as part of a line', () => {
    const line = tokenise(':nick!user@host PRIVMSG #channel hello')
    const hm = hostmask('nick!user@host')
    assert.deepStrictEqual(line.hostmask, hm)
  })

  it('Getting line.hostname should throw if message lacks source', () => {
    const line = tokenise('PRIVMSG #channel hello')
    assert.throws(() => {
      line.hostmask
    }, {
      name: 'TypeError'
    })
  })
})
