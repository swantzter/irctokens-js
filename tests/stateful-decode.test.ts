/* eslint-env mocha */
import assert from 'assert'
import { StatefulDecoder, tokenise } from '../src'

export function str2buf (str: string) {
  const encoder = new TextEncoder()
  return encoder.encode(str)
}

describe('StatefulDecoder', () => {
  it('Should decode partial', () => {
    const decoder = new StatefulDecoder()
    let lines = decoder.push(str2buf('PRIVMSG '))

    assert.deepStrictEqual(lines, [])

    lines = decoder.push(str2buf('#channel hello\r\n'))
    assert.strictEqual(lines?.length, 1)
    const line = tokenise('PRIVMSG #channel hello')
    assert.deepStrictEqual(lines, [line])
  })

  it('Should decode multiple', () => {
    const decoder = new StatefulDecoder()
    const lines = decoder.push(str2buf('PRIVMSG #channel1 hello\r\nPRIVMSG #channel2 hello\r\n'))
    assert.strictEqual(lines?.length, 2)

    const line1 = tokenise('PRIVMSG #channel1 hello')
    const line2 = tokenise('PRIVMSG #channel2 hello')
    assert.deepStrictEqual(lines[0], line1)
    assert.deepStrictEqual(lines[1], line2)
  })

  it('Should handle non-utf8 encoding', () => {
    const decoder = new StatefulDecoder('iso-8859-2')
    const lines = decoder.push(Uint8Array.from([
      0x50, 0x52, 0x49, 0x56, 0x4d, 0x53, 0x47, 0x20, 0x23, 0x63, 0x68, 0x61,
      0x6e, 0x6e, 0x65, 0x6c, 0x20, 0x3a, 0x68, 0x65, 0x6c, 0x6c, 0x6f, 0x20,
      0xc8,
      0x0d, 0x0a, // \r\n
    ]))
    const line = tokenise('PRIVMSG #channel :hello Č')

    assert.strictEqual(lines?.length, 1)
    assert.deepStrictEqual(lines[0], line)
  })

  it('Should fallback to non-utf encoding', () => {
    const decoder = new StatefulDecoder('utf8', 'latin1')
    const lines = decoder.push(Uint8Array.from([
      0x50, 0x52, 0x49, 0x56, 0x4d, 0x53, 0x47, 0x20, 0x23, 0x63, 0x68, 0x61,
      0x6e, 0x6e, 0x65, 0x6c, 0x20, 0x68, 0xe9, 0x6c, 0x6c, 0xf3,
      0x0d, 0x0a, // \r\n
    ]))
    const line = tokenise('PRIVMSG #channel hélló')

    assert.strictEqual(lines?.length, 1)
    assert.deepStrictEqual(lines[0], line)
  })

  it('Should return undefined if given no input', () => {
    const decoder = new StatefulDecoder()
    const lines = decoder.push(new Uint8Array())
    assert.strictEqual(lines, undefined)
  })

  it('Should return undefined if given unterminated input', () => {
    const decoder = new StatefulDecoder()
    decoder.push(str2buf('PRIVMSG #channel hello'))
    const lines = decoder.push(new Uint8Array())
    assert.strictEqual(lines, undefined)
  })

  it('Should be clearable', () => {
    const decoder = new StatefulDecoder()
    decoder.push(str2buf('PRIVMSG '))
    decoder.clear()
    assert.deepStrictEqual(decoder.pending(), new Uint8Array())
  })

  it('Should handle encoding mismatches', () => {
    const decoder = new StatefulDecoder()
    decoder.push(str2buf('@asd=á '))
    const lines = decoder.push(Uint8Array.from([
      // latin1: PRIVMSG #chan :á
      0x50, 0x52, 0x49, 0x56, 0x4d, 0x53, 0x47, 0x20, 0x23, 0x63, 0x68, 0x61,
      0x6e, 0x20, 0x3a, 0xe1,
      0x0d, 0x0a, // \r\n
    ]))

    assert.strictEqual(lines?.length, 1)
    assert.strictEqual(lines[0].params[1], 'á')
    assert.strictEqual(lines[0].tags?.asd, 'á')
  })
})
