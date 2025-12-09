/* eslint-env mocha */
import assert from 'assert'
import YAML from 'yaml'
import path from 'path'
import { readFileSync } from 'fs'
import { Line, tokenise } from '../src'

// run test cases sourced from:
// https://github.com/ircdocs/parser-tests

const dataDir = path.join(__dirname, 'data')

describe('parser tests', () => {
  describe('split', () => {
    const { tests }: {
      tests: Array<{
        input: string
        atoms: {
          tags?: Record<string, string>
          source?: string
          verb?: string
          params?: string[]
        }
      }>
    } = YAML.parse(readFileSync(path.join(dataDir, 'msg-split.yaml'), 'utf-8'))

    for (const test of tests) {
      it(`parses ${test.input}`, () => {
        const tokens = tokenise(test.input)

        assert.deepStrictEqual(tokens.tags, test.atoms.tags)
        assert.deepStrictEqual(tokens.source, test.atoms.source)
        assert.deepStrictEqual(tokens.command, test.atoms.verb?.toLocaleUpperCase())
        assert.deepStrictEqual(tokens.params, test.atoms.params ?? [])
      })
    }
  })

  describe('join', () => {
    const { tests } = YAML.parse(readFileSync(path.join(dataDir, 'msg-join.yaml'), 'utf-8'))

    for (const { atoms, matches } of tests) {
      it(`joins ${matches}`, () => {
        const line = new Line({
          command: atoms.verb,
          params: atoms.params ?? [],
          source: atoms.source,
          tags: atoms.tags,
        })

        assert.ok(matches.includes(line.format()), `\n  ${line.format()}\nwas not found in\n  ${matches.join('\n  ')}`)
      })
    }
  })
})
