/* eslint-env mocha */
import assert from 'assert'
import { Line } from '../src'

describe('format', () => {
  describe('tags', () => {
    it('Should format a line with tags', () => {
      const line = new Line({
        command: 'PRIVMSG',
        params: ['#channel', 'hello'],
        tags: { id: '\\ ;\r\n' }
      })
      assert.strictEqual(line.format(), '@id=\\\\\\s\\:\\r\\n PRIVMSG #channel hello')
    })

    it('Should format without tags', () => {
      const line = new Line({ command: 'PRIVMSG', params: ['#channel', 'hello'] })
      assert.strictEqual(line.format(), 'PRIVMSG #channel hello')
    })

    it('Should handle tags with undefined value', () => {
      const line = new Line({
        command: 'PRIVMSG',
        params: ['#channel', 'hello'],
        tags: { a: undefined as unknown as string }
      })
      assert.strictEqual(line.format(), '@a PRIVMSG #channel hello')
    })

    it('Should handle tags with empty string value', () => {
      const line = new Line({
        command: 'PRIVMSG',
        params: ['#channel', 'hello'],
        tags: { a: '' }
      })
      assert.strictEqual(line.format(), '@a PRIVMSG #channel hello')
    })
  })

  describe('source', () => {
    it('Should format a line with source', () => {
      const line = new Line({
        command: 'PRIVMSG',
        params: ['#channel', 'hello'],
        source: 'nick!user@host'
      })
      assert.strictEqual(line.format(), ':nick!user@host PRIVMSG #channel hello')
    })
  })

  describe('command', () => {
    it('Should format a line with a lowercase command', () => {
      const line = new Line({ command: 'privmsg', params: null as unknown as string[] })
      assert.strictEqual(line.format(), 'privmsg')
    })

    it('Should format a line with an uppercase command', () => {
      const line = new Line({ command: 'PRIVMSG', params: null as unknown as string[] })
      assert.strictEqual(line.format(), 'PRIVMSG')
    })
  })

  describe('trailing param', () => {
    it('Should format a line with a space in the trailing param', () => {
      const line = new Line({ command: 'PRIVMSG', params: ['#channel', 'hello world'] })
      assert.strictEqual(line.format(), 'PRIVMSG #channel :hello world')
    })

    it('Should format a line without a space in the trailing param', () => {
      const line = new Line({ command: 'PRIVMSG', params: ['#channel', 'helloworld'] })
      assert.strictEqual(line.format(), 'PRIVMSG #channel helloworld')
    })

    it('Should format a line with a colon in the trailing param', () => {
      const line = new Line({ command: 'PRIVMSG', params: ['#channel', ':helloworld'] })
      assert.strictEqual(line.format(), 'PRIVMSG #channel ::helloworld')
    })
  })

  describe('invalid param', () => {
    it('Should throw if non-last param includes a space', () => {
      const line = new Line({ command: 'PRIVMSG', params: ['user', '0 *', 'real name'] })
      assert.throws(() => {
        line.format()
      }, {
        name: 'TypeError'
      })
    })

    it('Should throw if non-lst param includes a colon', () => {
      const line = new Line({ command: 'PRIVMSG', params: [':#channel', 'hello'] })
      assert.throws(() => {
        line.format()
      }, {
        name: 'TypeError'
      })
    })
  })
})
