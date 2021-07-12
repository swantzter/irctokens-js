/* eslint-env mocha */
import assert from 'assert'
import { StatefulEncoder, tokenise } from '../src'
import { str2buf } from './stateful-decode.test'

describe('StatefulEncoder', () => {
  it('Should push a line', () => {
    const encoder = new StatefulEncoder()
    const line = tokenise('PRIVMSG #channel hello')
    encoder.push(line)
    assert.deepStrictEqual(encoder.pending(), str2buf('PRIVMSG #channel hello\r\n'))
  })

  it('Should pop of a partial line', () => {
    const encoder = new StatefulEncoder()
    const line = tokenise('PRIVMSG #channel hello')
    encoder.push(line)
    encoder.pop(str2buf('PRIVMSG #channel hello').length)

    assert.deepStrictEqual(encoder.pending(), str2buf('\r\n'))
  })

  it('Should only pop off first full line when more requested', () => {
    const encoder = new StatefulEncoder()
    const line = tokenise('PRIVMSG #channel hello')
    encoder.push(line)
    encoder.push(line)
    const lines = encoder.pop(str2buf('PRIVMSG #channel hello\r\nPRIVMSG').length)

    assert.strictEqual(lines.length, 1)
    assert.deepStrictEqual(lines[0], line)
  })

  it('Should return no lines on pop if there are no complete lines in requested size', () => {
    const encoder = new StatefulEncoder()
    const line = tokenise('PRIVMSG #channel hello')
    encoder.push(line)
    const lines = encoder.pop(1)
    assert.strictEqual(lines.length, 0)
  })

  it('Should be clearable', () => {
    const encoder = new StatefulEncoder()
    encoder.push(tokenise('PRIVMSG #channel hello'))
    encoder.clear()

    assert.deepStrictEqual(encoder.pending(), new Uint8Array())
  })
})
