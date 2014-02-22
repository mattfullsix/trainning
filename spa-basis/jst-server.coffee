fs       = require('fs')
http     = require('http')
express  = require('express')
socketio = require('socket.io')

DB = []

loadDB = ->
  path = "#{__dirname}/db.json"
  fs.stat path, (err, stat) ->
    if (err || !stat.isFile())
      console.log "[DB Load] DB could not be loaded: DB file missing or invalid."
      return
    fs.readFile path, (err, data) ->
      if err
        console.log "[DB Load Error]: #{err}"
      else
        DB = JSON.parse(data)
        console.log "[DB Load] starts with #{DB.length} item(s)"

persistDB = ->
  fs.writeFile "#{__dirname}/db.json", JSON.stringify(DB)
  console.log "[DB Save] Persisted BD with #{DB.length} item(s)"

module.exports = startServer: ->
  loadDB()
  app = express()
  server = http.createServer(app)
  io = socketio.listen(server)

  # The basics

  app.configure ->
    app.use express.static "#{__dirname}/public"
    app.use express.errorHandler dumpExceptions: true, showStack: true
    app.use express.logger format: ':method :url'
    app.use express.urlencoded()
    app.use express.json()
    app.use express.methodOverride()

  app.get '/', (request, response) ->
    response.sendfile 'public/index.html'

  # Sync endpoints (Ajax)

  app.get '/checkins', (request, response) ->
    response.json DB.slice(0, 10)

  app.post '/checkins', (request, response) ->
    checkIn = request.body
    checkIn.id = DB.length
    DB.unshift checkIn
    persistDB()
    response.json { id: checkIn.id }, 201
    io.sockets.emit 'checkin', checkIn

  server.listen 3333, ->
    console.log "Listening on port 3333… WebSockets enabled."
