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
