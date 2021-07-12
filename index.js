const { Socket } = require('net')
const irctokens = require('.')

const NICK = 'nickname'
const CHAN = '#channel'

const d = new irctokens.StatefulDecoder()
const e = new irctokens.StatefulEncoder()
const s = new Socket()
s.connect(6667, '127.0.0.1')

function send (line) { // :Line
  console.log(`> ${line.format()}`)
  e.push(line)
  const pend = e.pending()
  s.write(pend)
  e.pop(pend.length)
}

s.once('connect', () => {
  send(new irctokens.Line({ command: 'USER', params: ['username', '0', '*', 'real name'] }))
  send(new irctokens.Line({ command: 'NICK', params: [NICK] }))
})

s.on('data', data => {
  const lines = d.push(Uint8Array.from(data))

  if (!lines) return

  for (const line of lines) {
    console.log(`< ${line.format()}`)
    if (line.command === 'PING') send(new irctokens.Line({ command: 'PONG', params: [line.params[0]] }))
    else if (line.command === '001') send(new irctokens.Line({ command: 'JOIN', params: [CHAN] }))
  }
})
