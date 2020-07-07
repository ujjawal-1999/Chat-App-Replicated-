const express = require('express');
const http = require('http');
const PORT = 3000 || process.env.PORT;
const path = require('path');
const socketio = require('socket.io');
const cors = require('cors');
const formatMessage = require('./utils/messages');
const { userJoin, getCurrentUser, userLeave, getRoomUsers } = require('./utils/users');
const botname = 'ChatCord Bot';

const app = express();
const server = http.createServer(app);
const io = socketio(server);
//Configure Static Folder
app.use(express.static(path.join(__dirname,'public')));
app.use(cors());

//Run when client connects
io.on('connection',socket=>{

    //Join a Room
    socket.on('joinRoom',({ username, room })=>{
        
        const user = userJoin(socket.id,username,room);
        
        socket.join(user.room);

        //Welcome a user
        socket.emit('message',formatMessage(botname,'Welcome to ChatCord'));

        //Broadcast when a user connects
        socket.broadcast.to(user.room).emit('message',formatMessage(botname,`${user.username} has joined the chat`));

        //Send Users and room info
        io.to(user.room).emit('roomUsers',{
            room:user.room,
            users:getRoomUsers(user.room)
        });
    })
    
    //Listen for chat message
    socket.on('chatMessage',(msg)=>{
        const user = getCurrentUser(socket.id);
        io.to(user.room).emit('message',formatMessage(user.username,msg));
    })

    //Notify when a user leaves
    socket.on('disconnect',()=>{
        const user = userLeave(socket.id);
        if(user){
            io.to(user.room).emit('message',formatMessage(botname,`${user.username} has left the chat`));
            //Send Users and room info
        io.to(user.room).emit('roomUsers',{
            room:user.room,
            users:getRoomUsers(user.room)
        });
        }

    });
})

server.listen(PORT,()=>{
    console.log(`Server running on port: ${PORT}`);
})