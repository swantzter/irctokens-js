import { TAG_ESCAPED, TAG_UNESCAPED_REGEX } from './const'

function escapeTag (value: string) {
  let processed = value
  for (let idx = 0; idx < TAG_ESCAPED.length; idx++) {
    processed = processed.replace(TAG_UNESCAPED_REGEX[idx], TAG_ESCAPED[idx])
  }
  return processed
}

export interface FormatArgs {
  tags?: Record<string, string>
  source?: string
  command: string
  params: string[]
}

export function format ({ tags, source, command, params }: FormatArgs) {
  const outs: string[] = []

  if (tags) {
    const tagsStr = []
    for (const [key, val] of Object.entries(tags).sort(([a], [b]) => a.localeCompare(b))) {
      if (val) tagsStr.push(`${key}=${escapeTag(val)}`)
      else tagsStr.push(key)
    }
    outs.push(`@${tagsStr.join(';')}`)
  }

  if (source) {
    outs.push(`:${source}`)
  }

  outs.push(command)

  if (params) {
    const paramCopy = [...params]
    let last = paramCopy.pop()

    for (const param of paramCopy) {
      if (param.includes(' ')) throw new TypeError('non last params cannot have spaces')
      else if (param.startsWith(':')) throw new TypeError('non last params cannot start with colon')
    }
    outs.push(...paramCopy)

    if (!last || last.includes(' ') || last.startsWith(':')) {
      last = `:${last ?? ''}`
    }
    outs.push(last)
  }

  return outs.join(' ')
}
