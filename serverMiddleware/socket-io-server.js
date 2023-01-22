// This file is executed once when the server is started
console.log("Setting up socket.io server ...")

// Setup a socket.io server on port 3001 that has CORS disabled (do not set this to port 3000 as port 3000 is where the nuxt dev server serves your nuxt application)
const io = require("socket.io")(3001, {
    cors: {
        // No CORS at all
        origin: '*',
    }
});

var i = 0;
// Broadcast "tick" event every second
// Or do whatever you want with io ;)
setInterval(() => {
    i++;
    io.emit("tick", i);
}, 1000);

io.on("connection", socket => {
    socket.on('user_arrived', function(data) {
       
        // User connects to a specific room (it's an object)       
        socket.join(data.room);
              
        // All users except sender in the room receive an notification
        const clients =Array.from(io.sockets.adapter.rooms.get(data.room));
        
        const isFirstClient = clients.length === 1;
        socket.emit('admin', isFirstClient);
        io.to(data.room).emit('server_user_arrived', {socket : socket.id, username:data.username})

    });
    socket.on('game_created', () => {
        io.emit('update_list');
    }); 
    socket.on('client_user_start', function(data){
        socket.to(data.room).emit('server_game_started');
    })
    socket.on('client_user_send_username', function(data){
        socket.to(data.room).emit('server_user_send_username', {socket : socket.id, Opponentusername:data.username});
    })
    socket.on('client_user_response', function(data){
       
        socket.to(data.room).emit('server_user_paused');
    })
    socket.on('client_user_next_question', function(data){
       
        socket.to(data.room).emit('server_next_question');
    })
    socket.on('client_user_good_response', function(data){
         
        socket.to(data.room).emit('server_opponent_good_response', {scoreOpponent : data.scoreOpponent});
    })
    socket.on('client_user_bad_response', function(data){
         
        socket.to(data.room).emit('server_opponent_bad_response');
    })


    socket.on("disconnect", () => {
        // socket.rooms.size === 0
      });

});

// Since we are a serverMiddleware, we have to return a handler, even if this it does nothing
export default function (req, res, next) {
    next()
}