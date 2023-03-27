let url = window.location.pathname
let search = window.location.search
let query = new URLSearchParams(search)

let mode = query.has('mode') ? query.get('mode').toLowerCase() : 'real'
let currency = query.has('currency')
  ? query.get('currency').toLowerCase()
  : 'eur'
let client = query.has('client') ? query.get('client').toLowerCase() : null
let player = query.has('player') ? query.get('player').toLowerCase() : null

let game = null
let ws_connection = null

document.addEventListener('DOMContentLoaded', event => {
  ws_connection = new WS_connection()
  hide_loader()
})

class Game {
  #game_state = 0
  #first_blink_needed = true
  #second_blink_needed = true
  constructor() {
    this.spaceport = new Spaceport()
  }

  show_message(message) {}

  set_game_state(state = 0) {
    this.game_state = state || 0
    console.log(`Game state changed to ${this.game_state}`)
    switch (this.game_state) {
      case 'close':
        this.spaceport.make_close()
        break
      case 'mid':
        this.spaceport.make_mid(this.#first_blink_needed)
        this.#first_blink_needed = false
        break
      case 'far':
        this.spaceport.make_far(this.#second_blink_needed)
        this.#second_blink_needed = false
        break
      case 'launch':
        this.spaceport.make_launch()
        break
      case 'takeoff':
        this.spaceport.make_takeoff()
        break
      case 'blow':
        this.spaceport.make_blow()
        break
      case 'cooldown':
        this.spaceport.make_cooldown()
        break
      default:
        console.log('State unknown')
    }
  }

  get_game_state() {
    return this.game_state
  }
}

class Spaceport {
  constructor() {
    this.game = document.querySelector('#game')
    this.spaceport = document.querySelector('#spaceport')
    this.binoculars = document.querySelector('#binoculars')
    this.black = document.querySelector('#black')
  }

  make_close() {
    this.black.classList.add('hidden')
    this.spaceport.classList.remove('spaceport_mid')
    this.spaceport.classList.remove('spaceport_far')
    this.binoculars.classList.remove('hidden')
    this.spaceport.classList.remove('spaceport_launch')
    this.binoculars.classList.add('binoculars_moving')
  }

  make_mid(blink_needed = false) {
    if (blink_needed) this.make_blink()
    this.spaceport.classList.add('spaceport_mid')
    this.spaceport.classList.remove('spaceport_far')
    this.binoculars.classList.remove('hidden')
    this.binoculars.classList.remove('binoculars_moving')
  }

  make_far(blink_needed = false) {
    if (blink_needed) this.make_blink()
    this.spaceport.classList.remove('spaceport_mid')
    this.spaceport.classList.add('spaceport_far')
    this.binoculars.classList.add('hidden')
  }

  make_launch() {
    this.spaceport.classList.remove('spaceport_mid')
    this.spaceport.classList.remove('spaceport_far')
    this.spaceport.classList.add('spaceport_launch')
  }

  make_takeoff() {}

  make_blow() {}

  make_cooldown() {}

  make_blink() {
    this.black.classList.remove('hidden')
    setTimeout(() => {
      this.black.classList.add('hidden')
    }, 400)
  }
}

class WS_connection {
  wsURL = 'wss://wsup.whitie.ru:9001'
  constructor() {
    this.ws = new WebSocket(this.wsURL)

    this.ws.onopen = this.handle_open.bind(this)
    this.ws.onmessage = this.handle_message
    this.ws.onclose = this.handle_close
    this.ws.onerror = this.handle_error
  }

  handle_open(event) {
    console.log(`Connected to ${this.wsURL}`)
    this.ws.send('{"foo":"bar"}')
  }

  handle_message(event) {
    let message = event.data
    let data = JSON.parse(message)
    console.log(`Message recieved: ${message}`)
    if (data.type == 'game_start') start_new_game()
    if (!game) return
    if (data.type == 'game_state') game.set_game_state(data.game_state)
  }

  handle_close(event) {
    if (event.wasClean) {
      console.log(
        `Connection closed with code ${event.code} due to ${event.reason}`
      )
    } else {
      console.log('Connection aborted')
    }
  }

  handle_error(error) {
    console.log(error)
  }
}

function start_new_game() {
  game = new Game()
  hide_wait()
}

function hide_loader() {
  let loader = document.querySelector('#loading')
  loader.classList.add('hidden')
}

function hide_wait() {
  let wait = document.querySelector('#wait')
  wait.classList.add('hidden')
}
