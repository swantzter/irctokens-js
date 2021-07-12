# irctokens

[![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com)
[![QA](https://github.com/swantzter/irctokens-js/actions/workflows/qa.yml/badge.svg)](https://github.com/swantzter/irctokens-js/actions/workflows/qa.yml)
[![Publish to NPM and GCR](https://github.com/swantzter/irctokens-js/actions/workflows/publish.yml/badge.svg)](https://github.com/swantzter/irctokens-js/actions/workflows/publish.yml)
[![codecov](https://codecov.io/gh/swantzter/irctokens-js/branch/main/graph/badge.svg)](https://codecov.io/gh/swantzter/irctokens-js)

TypeScript port of the python library [irctokens](https://github.com/jesopo/irctokens).
The major and minor version of this library will aim to follow upstream, patch
will be increased independently.

## rationale

there's far too many IRC client implementations out in the world that do not
tokenise data correctly and thus fall victim to things like colons either being
where you don't expect them or not being where you expect them.

## usage

### installation

`$ npm install irctokens`

### tokenisation
```typescript
import { tokenise } from 'irctokens'
const line = tokenise('@id=123 :Swant!~swant@hostname PRIVMSG #chat :hello there!')

console.log(line.tags)
// { id: '123' }

console.log(line.source)
// 'Swant!~swant@hostname'

console.log(line.hostmask)
// Hostmask { nickname: 'Swant', username: '~swant', hostname: 'hostname' }

console.log(line.command)
// 'PRIVMSG'

console.log(line.params)
// ['#chat', 'hello there!']
```

### formatting

```typescript
import { Line } from 'irctokens'
const line = new Line({ command: 'USER', params: ['user', '0', '*', 'real name'] })

console.log(line.format())
// 'USER user 0 * :real name'
```

### stateful

below is an example of a fully socket-wise safe IRC client connection that will
connect and join a channel. both protocol sending and receiving are handled by
irctokens.

```typescript
import { Socket } from 'net'
import { Line, StatefulEncoder, StatefulDecoder } from 'irctokens'

const NICK = 'nickname'
const CHAN = '#channel'

const d = new StatefulDecoder()
const e = new StatefulEncoder()
const s = new Socket()
s.connect(6667, '127.0.0.1')

function send (line: Line) {
  console.log(`> ${line.format()}`)
  e.push(line)
  const pending = e.pending()
  s.write(pending)
  e.pop(pending.length)
}

s.once('connect', () => {
  send(new Line({ command: 'USER', params: ['username', '0', '*', 'real name'] }))
  send(new Line({ command: 'NICK', params: [NICK] }))
})

s.on('data', data => {
  const lines = d.push(Uint8Array.from(data))

  if (!lines) return

  for (const line of lines) {
    console.log(`< ${line.format()}`)
    if (line.command === 'PING') send(new Line({ command: 'PONG', params: [line.params[0]] }))
    else if (line.command === '001') send(new Line({ command: 'JOIN', params: [CHAN] }))
  }
})
```

## contact

Come say hi at `#irctokens` on irc.libera.chat
