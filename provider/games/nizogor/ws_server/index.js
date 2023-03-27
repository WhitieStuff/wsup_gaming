const router = require("express").Router()
const { createServer } = require('https')
const { readFileSync } = require('fs')
const { WebSocketServer } = require('ws')

const port = 9001
const server = createServer({
  cert: readFileSync('/etc/letsencrypt/live/wsup.whitie.ru/cert.pem'),
  key: readFileSync('/etc/letsencrypt/live/wsup.whitie.ru/privkey.pem')
})

const wss = new WebSocketServer({ server })

wss.on('connection', ws => {
  ws.on('error', console.error)

  ws.on('message', data => {
    console.log('Message received: %s', data)
  })

  ws.send('{"type":"service", "message":"Connected to WS. This is a welcome message."}')
})

/**
 * Broadcasts a given message to all WSS clients.
 * @param {object} body Body of the message.
 */
function broadcast(body = {}) {
  message = JSON.stringify(body)
  // console.log(`Broadcasting: ${message}`)
  wss.clients.forEach(client => client.send(message))
}

/**
 * Iteration of one round.
 */
class RocketLaunch {
  /**
   * Launch states sent to clients.
   */
  launch_states = {
    close: "close",
    mid: "mid",
    far: "far",
    heating: "heating",
    launch: "launch",
    takeoff: "takeoff"
  }
  /** Countdown duration in seconds. */
  launch_countdown = 10
  /** Interval for the coundown. Set in **constructor()** */
  launch_interval = null

  /**
   * State of current flight.
   *
   * **0** - flying;
   * **1** - blown.
   */
  flight_state = 0
  /** Duration of the flight. Generated in **start_flight()** */
  flight_duration = null
  /** Interval for the flight. Set in **start_flight()** */
  flight_interval = null

  /** Current state of the cooldown.
   *
   * **0** - not cooling down;
   * **1** - cooling down.
   */
  cooldown_state = 0
  /** Duration of the cooldown in seconds. */
  cooldown_duration = 4
  /** Timeout for cooldown. Set in **start_cooldown()** */
  cooldown_timeout = null

  /**
   * Start the contdown.
   *
   * Calls **change_state()** once a second.
   */
  constructor() {
    this.launch_interval = setInterval(this.change_state.bind(this), 1000)
    // console.log(`Countdown started`)
  }

  /**
   * Changes and broadcasts the state of the countdown.
   *
   * Calls **start_flight()** after the countdown.
   */
  change_state() {
    // console.log(`Countdown: ${this.launch_countdown}`)
    switch (this.launch_countdown) {
      case 10:
      case 9:
        this.send_countdown_state(this.launch_states.close)
        break
      case 8:
      case 7:
        this.send_countdown_state(this.launch_states.mid)
        break
      case 6:
      case 5:
        this.send_countdown_state(this.launch_states.far)
        break
      case 4:
      case 3:
      case 2:
      case 1:
        this.send_countdown_state(this.launch_states.launch)
        break
      case 0:
        this.send_countdown_state(this.launch_states.takeoff)
        this.start_flight()
        break
    }
    this.launch_countdown--
  }

  send_countdown_state(state = '') {
    let message = {
      type: 'game_state',
      launch_countdown: this.launch_countdown,
      game_state: state
    }
    broadcast(message)
  }

  /**
   * Starts the flight for generated duration.
   *
   * Calls **blow_rocket()** after that.
   */
  start_flight() {
    clearInterval(this.launch_interval)
    this.flight_duration = this.generate_duration()
    // console.log(`Flight starts: ${this.flight_duration / 1000}s`)

    this.flight_interval = setInterval(
      this.blow_rocket.bind(this),
      this.flight_duration
    )
  }

  /**
   * Blows the rocket.
   *
   * Calls **start_cooldown()** after the blow.
   */
  blow_rocket() {
    clearInterval(this.flight_interval)
    this.flight_state = 1
    // console.log(`Rocket blows`)
    broadcast({
      type: 'game_state',
      game_state: 'blow'
    })
    this.start_cooldown()
  }

  /**
   * Starts cooldown after the rocket blows.
   *
   * Calls **finish_cooldown()** after the cooldown.
   */
  start_cooldown() {
    // console.log(`Cooldown starts`)
    this.cooldown_state = 1
    broadcast({
      type: 'game_state',
      game_state: 'cooldown'
    })
    this.cooldown_timeout = setTimeout(
      this.finish_cooldown.bind(this),
      this.cooldown_duration * 1000
    )
  }

  /**
   * Finishes cooldown and starts a new game.
   *
   * Calls global **start_new_game()**.
   */
  finish_cooldown() {
    // console.log(`Cooldown ends. Game finished`)
    clearTimeout(this.cooldown_timeout)
    this.cooldown_state = 0
    broadcast({
      type: 'game_finish'
    })
    start_new_game()
  }

  // Service methods:

  /**
   * Generates duration of the flight until blow.
   * @returns {float} Duration of the fligt.
   */
  generate_duration() {
    let random =
      this.get_random(4) +
      this.get_random(4, 5) +
      this.get_random(4, 5) +
      this.get_random(4, 5) +
      this.get_random(8, 9)
    random = random < 0.1 ? 0.1 : random
    random *= 1000
    return random
  }

  /**
   * Return random float.
   * @param {number} max Max value.
   * @param {number} chance Chance of zero (0-10/10).
   * @returns {float} Random float.
   */
  get_random(max = 1, chance = 0) {
    let new_random =
      Math.round(Math.random() * 10) <= chance ? 0 : Math.random() * max
    return new_random
  }
}

/**
 * Starts and broadcasting a new game.
 *
 * Initializes a new object of **RocketLaunch()** class.
 */
function start_new_game() {
  rocketLaunch = new RocketLaunch()
  // console.log('New game started')
  broadcast({
    type: 'game_start'
  })
}

/**
 * Object of **RocketLaulch()** class.
 */
let rocketLaunch = null

start_new_game()

server.listen(port)
