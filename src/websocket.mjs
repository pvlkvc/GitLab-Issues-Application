// import { WebSocketServer } from 'ws'
import WebSocket, { WebSocketServer } from 'ws'
import { model } from '../src/model/user.mjs'

const wsServer = new WebSocketServer({
  noServer: true,
  clientTracking: true
})

wsServer.on('connection', (ws, req) => {
  console.log('# [WS] Connection received. Adding client.')
  wsServer.broadcastExceptSelf(ws, `New client connected (${wsServer.clients.size}).`)

  // Identify token's owner so data can be directed at their socket
  const params = new URLSearchParams(req.url.slice(2))
  console.log('# [WS] User connected with ', params.get('token'))
  ws.socketToken = params.get('token')

  ws.on('message', (data) => {
    console.log(`# [WS] ws got: ${data}`)

    // echo server
    // ws.send(data)

    // broadcast server
    wsServer.broadcastExceptSelf(ws, data)
  })

  ws.on('close', () => {
    console.info('# [WS] Client closed connection')
    console.log(wsServer.clients)
  })
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

wsServer.on('webhook', (token, data) => {
  for (const client of wsServer.clients) {
    console.log('# [WS] Connected clients token: ', client.socketToken)
    console.log('# [WS] Controllers token: ', token)
    if (client.socketToken === token) {
      console.log('# [WS] Socket client id matching')
      if (client.readyState === WebSocket.OPEN) {
        client.send(data)
        console.log('# [WS] Sent data to client.')
      }
      break
    }
  }
})

export default wsServer
