// import { WebSocketServer } from 'ws'
import WebSocket, { WebSocketServer } from 'ws'

const wsServer = new WebSocketServer({
  noServer: true,
  clientTracking: true
})

wsServer.on('connection', (ws, req) => {
  console.log('# [WS] Connection received. Adding client.')

  // Identify token's owner so data can be directed at their socket
  const params = new URLSearchParams(req.url.slice(2))
  ws.socketToken = params.get('token')

  ws.on('close', () => {
    console.info('# [WS] Client closed connection')
  })

  ws.on('error', console.error)
})

wsServer.on('webhook', (token, data) => {
  for (const client of wsServer.clients) {
    if (client.socketToken === token) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(data))
        console.log('# [WS] Sent data to client.')
      }
      break
    }
  }
})

export default wsServer
