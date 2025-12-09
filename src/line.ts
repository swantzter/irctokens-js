import { TAG_ESCAPED, TAG_UNESCAPED } from './const'
import { format } from './formatting'
import type { Hostmask } from './hostmask'
import { hostmask } from './hostmask'
import type { TextEncodingLabel } from '.'

export interface LineArgs {
  tags?: Record<string, string>
  source?: string
  command: string
  params: string[]
}

export class Line {
  tags?: Record<string, string>
  source?: string
  command: string
  params: string[]

  constructor ({ tags, source, command, params }: LineArgs) {
    this.tags = tags
    this.source = source
    this.command = command
    this.params = params
  }

  #hostmask?: Hostmask
  get hostmask () {
    if (this.source) {
      if (!this.#hostmask) this.#hostmask = hostmask(this.source)
      return this.#hostmask
    } else {
      throw new TypeError('cannot parse hostmask from null source')
    }
  }

  format () {
    return format({
      tags: this.tags,
      source: this.source,
      command: this.command,
      params: this.params,
    })
  }

  withSource (source: string) {
    return new Line({
      tags: this.tags,
      source,
      command: this.command,
      params: this.params,
    })
  }

  copy () {
    return new Line(this)
  }
}

function unescapeTag (value?: string) {
  let unescaped = ''
  if (!value) return unescaped
  const escaped = value.split('')
  while (escaped.length) {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const current = escaped.shift()!
    if (current === '\\') {
      if (escaped.length) {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        const next = escaped.shift()!
        const duo = `${current}${next}`
        const index = TAG_ESCAPED.indexOf(duo)

        if (index > -1) unescaped += TAG_UNESCAPED[index]
        else unescaped += next
      }
    } else {
      unescaped += current
    }
  }
  return unescaped
}

function _tokenise (line: string) {
  let value = line
  let tags: Record<string, string> | undefined
  if (value.startsWith('@')) {
    let tagsS
    ; [tagsS, value] = value.substring(1).split(/ (.*)/)
    tags = {}
    for (const part of tagsS.split(';')) {
      const [key, val] = part.split(/=(.*)/)
      tags[key] = unescapeTag(val)
    }
  }

  let trailing
  ; [value, trailing] = value.split(/ :(.*)/)
  const params = value.split(' ').filter(part => !!part)

  let source: string | undefined
  if (params[0].startsWith(':')) {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    source = (params.shift()!).substring(1)
  }

  if (!params.length) throw TypeError('Cannot tokenise command-less line')
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const command = (params.shift()!).toLocaleUpperCase()

  if (typeof trailing === 'string') params.push(trailing)

  return new Line({
    tags,
    source,
    command,
    params,
  })
}

export function tokenise (
  line: string | Uint8Array,
  encoding: TextEncodingLabel = 'utf8',
  fallback: TextEncodingLabel = 'latin1'
) {
  let dline = ''
  const decoder = new TextDecoder(encoding, { fatal: true })
  const fallbackDecoder = new TextDecoder(fallback, { fatal: true })
  if (line instanceof Uint8Array) {
    if (line[0] === '@'.charCodeAt(0)) {
      const idx = line.indexOf(' '.charCodeAt(0))
      const tagsB = line.slice(0, idx + 1)
      line = line.slice(idx + 1)
      dline += decoder.decode(tagsB)
    }
    try {
      dline += decoder.decode(line)
    } catch {
      dline += fallbackDecoder.decode(line)
    }
  } else {
    dline = line
  }

  for (const badchar of ['\x00', '\r', '\n']) {
    if (dline.includes(badchar)) {
      [dline] = dline.split(badchar)
    }
  }

  return _tokenise(dline)
}
