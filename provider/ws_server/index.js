const { createServer } = require('https')
const { readFileSync } = require('fs')
const { WebSocketServer } = require('ws')
const { randomBytes } = require('crypto')

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
  launch_countdown = 10
  launch_interval = null
  flight_duration = null
  flight_interval = null

  constructor() {
    this.launch_interval = setInterval(this.change_state, 1000)
  }

  change_state() {
    switch (this.launch_count--) {
      case (10, 9):
        wss.clients.forEach((client) => {
          client.send(
            JSON.stringify({
              launch_countdown: this.launch_countdown,
              launch_states: this.launch_states.close
            })
          )
        })
        break
      case (8, 7):
        wss.clients.forEach((client) => {
          client.send(
            JSON.stringify({
              launch_countdown: this.launch_countdown,
              launch_states: this.launch_states.mid
            })
          )
        })
        break
      case (6, 5):
        wss.clients.forEach((client) => {
          client.send(
            JSON.stringify({
              launch_countdown: this.launch_countdown,
              launch_states: this.launch_states.far
            })
          )
        })
        break
      case (4, 3, 2, 1):
        wss.clients.forEach((client) => {
          client.send(
            JSON.stringify({
              launch_countdown: this.launch_countdown,
              launch_states: this.launch_states.launch
            })
          )
        })
        break
      case 0:
        wss.clients.forEach((client) => {
          client.send(
            JSON.stringify({
              launch_countdown: this.launch_countdown,
              launch_states: this.launch_states.takeoff
            })
          )
          this.start_flight()
        })
        break
    }
  }
  start_flight() {
    clearInterval(this.launch_interval)
    flight_duration = this.generate_duration()
  }
  generate_duration() {
    let random = this.get_random(4) + this.get_random(4, 5)+ this.get_random(4, 5)+ this.get_random(4, 5)+ this.get_random(8, 9)
    random = random < 0.1 ? 0.1 : random
    return random
  }
  get_random(max = 1, chance = 0) {
    let new_random = Math.round(Math.random() * 10) >= chance ? Math.random() * max : 0
    return new_random
  }
}

let rocketLaunch = new RocketLaunch()

server.listen(9000)
