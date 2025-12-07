const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const { Server } = require('socket.io');
const http = require('http');
const authRoutes = require('./routes/Auth');
const projectRoutes = require('./routes/Project');
const taskRoutes = require('./routes/Task');
const connectDB = require('./config/db');
const path = require("path");
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: ["https://real-time-code-collab-frontend.onrender.com", process.env.LOCAL_CLIENT_URL],
    methods: ["GET", "POST"],
    credentials: true
  }
});



// CORS for REST API
app.use(cors({
  origin: ["https://real-time-code-collab-frontend.onrender.com", process.env.LOCAL_CLIENT_URL],
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  credentials: true,
}));

app.use(express.json());

const PORT = process.env.PORT || 5000;

connectDB();

app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/tasks', taskRoutes);










/// -------------------PREVIOUS SOCKET CONNECTION------------

const Task = require('./models/Task');
const User = require('./models/User'); // Ensure you have a User model
const userSocketMap = {};

// Handle user connection
io.on('connection', (socket) => {
  console.log('A user connected');

  // Handle user joining a task
  socket.on('joinTask', async ({ taskId, userId }) => {
    await handleJoinTask(socket, taskId, userId);
  });

  // Handle user leaving a task
  socket.on('leaveTask', async ({ taskId, userId }) => {
    await handleLeaveTask(socket, taskId, userId);
  });

  // Handle code changes
  socket.on('codeChange', ({ taskId, code, userId }) => {

    handleCodeChange(socket, taskId, code, userId);
  });

  // Handle chat messages
  socket.on('chatMessage', ({ taskId, message, userId }) => {
    handleChatMessage(socket, taskId, message, userId);
  });

  // Handle whiteboard updates
  socket.on('whiteboardUpdate', ({ taskId, whiteboardContent }) => {
    console.log(taskId, "updating the whiteboard");
    io.to(taskId).emit('updateWhiteboard', whiteboardContent);
  });

  // Handle clear canvas request
  socket.on('clearCanvas', (taskId) => {
    console.log(taskId, "clearing the whiteboard");
    // Emit to all clients in the room to clear the canvas
    io.to(taskId).emit('canvasCleared');
  });

  // Handle user disconnection
  socket.on('disconnect', async () => {
    await handleDisconnect(socket);
  });
});

// Function to handle a user joining a task
async function handleJoinTask(socket, taskId, userId) {
  socket.join(taskId);
  console.log("UserId from socket.io in server.js: ", userId, " TaskId: ", taskId);

  const user = await User.findById(userId);
  if (!user) {
    console.log('User not found');
    return;
  }

  const task = await Task.findByIdAndUpdate(taskId, {
    $addToSet: { connectedUsers: { userId: user._id, name: user.firstname } }
  }, { new: true }).populate('connectedUsers.userId', 'name');

  if (task) {
    io.to(taskId).emit('updateConnectedUsers', task.connectedUsers);
    io.to(taskId).emit('userJoined', { userId: user._id, name: user.firstname });
    console.log(`${user.firstname} joined task ${taskId}`);
  } else {
    console.log('Task not found');
  }

  // Add the task to the user's connected tasks
  if (!socket.connectedTasks) {
    socket.connectedTasks = new Set();
  }
  socket.connectedTasks.add(taskId);

  // Map socket id to user id
  userSocketMap[socket.id] = userId;
}

// Function to handle a user leaving a task
async function handleLeaveTask(socket, taskId, userId) {
  socket.leave(taskId);

  const task = await Task.findByIdAndUpdate(taskId, {
    $pull: { connectedUsers: { userId: userId } }
  }, { new: true }).populate('connectedUsers.userId', 'name');

  if (task) {
    io.to(taskId).emit('updateConnectedUsers', task.connectedUsers);
    console.log(`User ${userId} disconnected from task ${taskId}`);
  } else {
    console.log('Task not found');
  }

  // Remove the task from the user's connected tasks
  if (socket.connectedTasks) {
    socket.connectedTasks.delete(taskId);
  }

  // Remove user id from the map
  delete userSocketMap[socket.id];
}

// Function to handle code changes
async function handleCodeChange(socket, taskId, code, userId) {
  const user = await User.findById(userId);
  const firstname = user.firstname;


  socket.broadcast.to(taskId).emit('codeChange', { code, firstname });
  console.log(`User ${userId} made code change in task ${taskId}`);
}

// Function to handle chat messages
function handleChatMessage(socket, taskId, message, userId) {
  console.log("From chatMessage connection : taskId: ", taskId, " message: ", message, " userId: ", userId);
  // io.to(taskId).emit('recieve-message', message);
  socket.to(taskId).emit('recieve-message', { userId, message });
  console.log(`User ${userId} sent a message in task ${taskId}`);
}

// Function to handle whiteboard updates
function handleWhiteboardUpdate(socket, taskId, x0, y0, x1, y1, color, tool, userId) {
  const data = { x0, y0, x1, y1, color, tool };
  socket.broadcast.to(taskId).emit('whiteboardUpdate', data);
  console.log(`User ${userId} updated whiteboard in task ${taskId}`);
}

// Function to handle user disconnection
async function handleDisconnect(socket) {
  console.log('User disconnected');
  if (socket.connectedTasks) {
    for (const taskId of socket.connectedTasks) {
      const userId = userSocketMap[socket.id];
      const task = await Task.findByIdAndUpdate(taskId, {
        $pull: { connectedUsers: { userId: userId } }
      }, { new: true }).populate('connectedUsers.userId', 'name');

      if (task) {
        io.to(taskId).emit('updateConnectedUsers', task.connectedUsers);
        console.log(`User ${userId} disconnected from task ${taskId}`);
      } else {
        console.log('Task not found');
      }
    }
  }
  delete userSocketMap[socket.id];
}


// // Serve static assets in production
// if (process.env.NODE_ENV === 'production') {
//   // Set static folder
//   app.use(express.static('client/build'));

//   app.get('*', (req, res) =>
//     res.sendFile(path.resolve(__dirname, 'client', 'build', 'index.html'))
//   );
// }

app.get('/', (req, res) => {
  res.send('Server is running');
});

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
})