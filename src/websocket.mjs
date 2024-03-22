// import { WebSocketServer } from 'ws'
import WebSocket, { WebSocketServer } from 'ws'

const wsServer = new WebSocketServer({
  noServer: true,
  clientTracking: true
})

wsServer.on('connection', (ws, req) => {
  // todo: assign client an id
  console.log('# [WS] Connection received. Adding client.')
  wsServer.broadcastExceptSelf(ws, `New client connected (${wsServer.clients.size}).`)

  // get the connected client's GITLAB ID ??
  // option B: request API to give current id (move API calls to another class?)
  console.log(req)

  ws.on('message', (data) => {
    console.log(`# [WS] ws got: ${data}`)

    // echo server
    // ws.send(data)

    // broadcast server
    wsServer.broadcastExceptSelf(ws, data)
  })

  ws.on('close', () => console.info('# [WS] Client closed connection'))
  ws.on('error', console.error)
})

/**
 * Broadcast a message to all clients.
 * @param {object} ws the current ws client
 * @param {string} data  the message to broadcast
 */
wsServer.broadcastExceptSelf = (ws, data) => {
  let clients = 0

  wsServer.clients.forEach((client) => {
    // if (client !== ws && client.readyState === WebSocket.OPEN) {
    if (client.readyState === WebSocket.OPEN) {
      clients++
      client.send(data)
    }
  })
  console.log(`# [WS] Broadcasted data to ${clients} (${wsServer.clients.size}) clients.`)
}

wsServer.sendToClient = (id, data) => {
  // identify client socket

  for (const i in wsServer.clients) {
    if (wsServer.clients[i].id === id) {
      if (wsServer.clients[i].readyState === WebSocket.OPEN) {
        wsServer.clients[i].send(data)
      }
      break
    }
  }

  console.log('# [WS] Sent data to client.')
}

export default wsServer
