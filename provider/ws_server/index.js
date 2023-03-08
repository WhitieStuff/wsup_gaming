const { createServer } = require('https')
const { readFileSync } = require('fs')
const { WebSocketServer } = require('ws')

const server = createServer({
  cert: readFileSync('/etc/letsencrypt/live/wsup.whitie.ru/cert.pem'),
  key: readFileSync('/etc/letsencrypt/live/wsup.whitie.ru/privkey.pem')
})

const wss = new WebSocketServer({ server })

wss.on('connection', ws => {
  ws.on('error', console.error)

  ws.on('message', data => {
    console.log('Message received: %s', data)

    wss.clients.forEach(client => {
      client.send(JSON.stringify({test:123}))
    })
  })

  ws.send('Connected to WS. This is a test message.')
})

server.listen(9000)