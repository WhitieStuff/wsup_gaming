const { createServer } = require('https')
const { readFileSync } = require('fs')
const { WebSocketServer } = require('ws')

const server = createServer({
  cert: readFileSync('/etc/letsencrypt/live/wsup.whitie.ru/cert.pem'),
  key: readFileSync('/etc/letsencrypt/live/wsup.whitie.ru/privkey.pem')
})

const wss = new WebSocketServer({ server })

wss.on('connection', (ws) => {
  ws.on('error', console.error)

  ws.on('message', (data) => {
    console.log('Message received: %s', data)

    // wss.clients.forEach(client => {
    //   client.send(JSON.stringify({test:123}))
    // })
  })

  ws.send('Connected to WS. This is a test message.')
})

class RocketLaunch {
  launch_states = {
    close: 100,
    mid: 200,
    far: 300,
    heating: 400,
    launch: 500,
    takeoff: 600,
    blow: 700,
    ready: 800
  }
  launch_count = 10
  launch_interval = null

  constructor() {
    this.launch_interval = setInterval(this.change_state, 1000)
  }

  change_state() {
    if (this.launch_count > 8) {
      wss.clients.forEach((client) => {
        client.send(JSON.stringify({ this.launch_count, this.launch_states.close}))
      })
    }
  }
}

let RocketLaunch = new RocketLaunch()

server.listen(9000)
