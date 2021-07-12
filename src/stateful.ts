import type { TextEncodingLabel } from '.'
import { Line, tokenise } from './line'

export class StatefulDecoder {
  #encoding: TextEncodingLabel
  #fallback: TextEncodingLabel
  #buffer: Uint8Array = new Uint8Array()

  constructor (encoding: TextEncodingLabel = 'utf8', fallback: TextEncodingLabel = 'latin1') {
    this.#encoding = encoding
    this.#fallback = fallback
    this.clear()
  }

  clear () {
    this.#buffer = new Uint8Array()
  }

  pending () {
    return this.#buffer
  }

  push (data: Uint8Array): Line[] | undefined {
    if (!data.length) return

    const newBuffer = new Uint8Array(this.#buffer.length + data.length)
    newBuffer.set(this.#buffer)
    newBuffer.set(data, this.#buffer.length)
    this.#buffer = newBuffer

    const lineBuffers: Uint8Array[] = []
    while (this.#buffer.includes('\n'.charCodeAt(0))) {
      const lfIdx = this.#buffer.indexOf('\n'.charCodeAt(0))
      const crIdx = this.#buffer.indexOf('\r'.charCodeAt(0))
      lineBuffers.push(this.#buffer.slice(0, crIdx < lfIdx ? crIdx : lfIdx))
      this.#buffer = this.#buffer.slice(lfIdx + 1)
    }

    const lines = []
    for (const line of lineBuffers) {
      lines.push(tokenise(line, this.#encoding, this.#fallback))
    }

    return lines
  }
}

export class StatefulEncoder {
  // #encoding: TextEncodingLabel // TODO only supports utf8 at the moment because of TextEncoder
  #encoder = new TextEncoder()
  #buffer = new Uint8Array()
  #bufferedLines: Line[] = []

  constructor () {
    this.clear()
  }

  clear () {
    this.#buffer = new Uint8Array()
    this.#bufferedLines = []
  }

  pending () {
    return this.#buffer
  }

  push (line: Line) {
    const lineBuffer = this.#encoder.encode(`${line.format()}\r\n`)
    const newBuffer = new Uint8Array(this.#buffer.length + lineBuffer.length)
    newBuffer.set(this.#buffer)
    newBuffer.set(lineBuffer, this.#buffer.length)

    this.#buffer = newBuffer
    this.#bufferedLines.push(line)
  }

  pop (byteCount: number) {
    const sent = this.#buffer.slice(0, byteCount).reduce((acc, curr) => {
      return acc + (curr === '\n'.charCodeAt(0) ? 1 : 0)
    }, 0)
    this.#buffer = this.#buffer.slice(byteCount)
    return new Array(sent).fill(null).map(_ => this.#bufferedLines.shift())
  }
}
