/* eslint-env mocha */
import assert from 'assert'
import { Line, tokenise } from '../src'
import { str2buf } from './stateful-decode.test'

describe('tokenise', () => {
  it('Should tokenise a line', () => {
    const line = tokenise('@id=123 :nick!user@host PRIVMSG #channel :hello world')
    assert.deepStrictEqual(line, new Line({
      tags: { id: '123' },
      source: 'nick!user@host',
      command: 'PRIVMSG',
      params: ['#channel', 'hello world']
    }))
  })

  it('Should stop tokenising at nullbyte', () => {
    const line = tokenise(':nick!user@host PRIVMSG #channel :hello\x00 world')
    assert.deepStrictEqual(line.params, ['#channel', 'hello'])
  })

  it('Should parse byte representation of a line', () => {
    const strLine = tokenise('@a=1 :n!u@h PRIVMSG #chan :hello word')
    const bufLine = tokenise(str2buf('@a=1 :n!u@h PRIVMSG #chan :hello word'))

    assert.deepStrictEqual(strLine, bufLine)
  })

  it('Should throw if missing command', () => {
    assert.throws(() => { tokenise(':n!u@h') }, { name: 'TypeError' })
    assert.throws(() => { tokenise('@tag=1 :n!u@h') }, { name: 'TypeError' })
  })

  describe('tags', () => {
    it('Should tokenise a line without tags', () => {
      const line = tokenise('PRIVMSG #channel')
      assert.strictEqual(line.tags, undefined)
    })

    it('Should tokenise an empty tag', () => {
      const line = tokenise('@id= PRIVMSG #channel')
      assert.deepStrictEqual(line.tags, { id: '' })
    })

    it('Should tokenise a tag with only key', () => {
      const line = tokenise('@id PRIVMSG #channel')
      assert.deepStrictEqual(line.tags, { id: '' })
    })

    it('Should unescape tags', () => {
      const line = tokenise('@id=1\\\\\\:\\r\\n\\s2 PRIVMSG #channel')
      assert.deepStrictEqual(line.tags, { id: '1\\;\r\n 2' })
    })

    it('Should unescape tags with overlapping escapes', () => {
      const line = tokenise('@id=1\\\\\\s\\\\s PRIVMSG #channel')
      assert.deepStrictEqual(line.tags, { id: '1\\ \\s' })
    })

    it('Should ignore trailing backslash', () => {
      const line = tokenise('@id=1\\ PRIVMSG #channel')
      assert.deepStrictEqual(line.tags, { id: '1' })
    })
  })

  describe('source', () => {
    it('Should find source in message without tags', () => {
      const line = tokenise(':nick!user@host PRIVMSG #channel')
      assert.strictEqual(line.source, 'nick!user@host')
    })

    it('Should find source in message with tags', () => {
      const line = tokenise('@id=123 :nick!user@host PRIVMSG #channel')
      assert.strictEqual(line.source, 'nick!user@host')
    })

    it('Should be undefined if no source in message without tags', () => {
      const line = tokenise('PRIVMSG #channel')
      assert.strictEqual(line.source, undefined)
    })

    it('Should be undefined if no source in message with tags', () => {
      const line = tokenise('@id=123 PRIVMSG #channel')
      assert.strictEqual(line.source, undefined)
    })
  })

  describe('command', () => {
    it('Should transform the command to uppercase', () => {
      const line = tokenise('privmsg #channel')
      assert.strictEqual(line.command, 'PRIVMSG')
    })
  })

  describe('params', () => {
    it('Should tokenise trailing paramerer', () => {
      const line = tokenise('PRIVMSG #channel :hello world')
      assert.deepStrictEqual(line.params, ['#channel', 'hello world'])
    })

    it('Should tokenise message with only a trailing parameter', () => {
      const line = tokenise('PRIVMSG :hello world')
      assert.deepStrictEqual(line.params, ['hello world'])
    })

    it('Should have an empty array fro messages without params', () => {
      const line = tokenise('PRIVMSG')
      assert.strictEqual(line.command, 'PRIVMSG')
      assert.deepStrictEqual(line.params, [])
    })
  })
})
