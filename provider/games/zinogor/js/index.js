let url = window.location.pathname
let search = window.location.search
let query = new URLSearchParams(search)

let mode = query.has('mode') ? query.get('mode').toLowerCase() : 'real'
let currency = query.has('currency') ? query.get('currency').toLowerCase() : 'eur'
let client = query.has('client') ? query.get('client').toLowerCase() : null
let player = query.has('player') ? query.get('player').toLowerCase() : null

/* ====== WebSocket Begins ====== */
let wsURL = 'wss://wsup.whitie.ru:9000'
let ws = new WebSocket(wsURL)

ws.onopen = (e) => {
  console.log(`Connected to ${wsURL}`)
  ws.send('{"foo":"bar"}')
}

ws.onmessage = (event) => {
  console.log(`Message recieved: ${event.data}`)
}

ws.onclose = function (event) {
  if (event.wasClean) {
    console.log(
      `Connection closed with code ${event.code} due to ${event.reason}`
    )
  } else {
    console.log('Connection aborted')
  }
}

ws.onerror = (error) => {
  console.log(error)
}
/* ====== WebSocket Ends ====== */