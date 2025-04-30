const { v4: uuidv4 } = require('uuid');

const getEmptyBoard = () => ([
  ['', '', ''],
  ['', '', ''],
  ['', '', '']
]);
const getEmptyState = () => ({
  board: getEmptyBoard(),
  currentPlayer: 'X',
  winner: null,
  playerXMoves: [],
  playerOMoves: [],
});

const waitingPlayers = [];
const sessions = {};

const registerMove = (state, player, move) => {
};

const handleJoin = (io, socket) => {
  if (waitingPlayers.length === 0) {
    const roomId = uuidv4();
    socket.join(roomId);
    socket.roomId = roomId;
    waitingPlayers.push(socket);

    console.log(`Player ${socket.id} is waiting in room ${roomId}`);
  } else {
    const opponentSocket = waitingPlayers.shift();
    const roomId = opponentSocket.roomId;

    socket.join(roomId);
    socket.roomId = roomId;

    const initialState = {
      state: getEmptyState(),
      players: {
        [opponentSocket.id]: 'X',
        [socket.id]: 'O',
      },
    };

    sessions[roomId] = initialState;

    console.log(`Game started in room ${roomId}`);

    io.to(roomId).emit('startGame', initialState.state);
    io.to(opponentSocket.id).emit('yourPlayer', { yourPlayer: 'X' });
    io.to(socket.id).emit('yourPlayer', { yourPlayer: 'O' });
  }
  console.log(`waitingPlayers: `, waitingPlayers.length);
};

const checkWinner = (board, currentPlayer) => {
  const winningCombinations = [
    // Rows
    [[0, 0], [0, 1], [0, 2]],
    [[1, 0], [1, 1], [1, 2]],
    [[2, 0], [2, 1], [2, 2]],
    // Columns
    [[0, 0], [1, 0], [2, 0]],
    [[0, 1], [1, 1], [2, 1]],
    [[0, 2], [1, 2], [2, 2]],
    // Diagonals
    [[0, 0], [1, 1], [2, 2]],
    [[0, 2], [1, 1], [2, 0]]
  ];

  return winningCombinations.some(pattern => (
    pattern.every(([r, c]) => board[r][c] === currentPlayer)
  ));
};

const handleMove = (io, socket, data) => {
  const roomId = socket.roomId;
  if (!roomId || !sessions[roomId] || sessions[roomId].winner) {
    console.log('Invalid room or game already over');
    return;
  }

  const state = sessions[roomId].state;
  const player = sessions[roomId].players[socket.id];
  if (!player || state.currentPlayer !== player) {
    return;
  }

  state.board[data.row][data.col] = player;
  state.winner = checkWinner(state.board, player) ? player : null;
  state.currentPlayer = player === 'X' ? 'O' : 'X';

  if (player === 'X') {
    state.playerXMoves.push(data);
    if (state.playerXMoves.length > 3) {
      const { row, col } = state.playerXMoves.shift();
      state.board[row][col] = '';
    }
  } else {
    state.playerOMoves.push(data);
    if (state.playerOMoves.length > 3) {
      const {row, col} = state.playerOMoves.shift();
      state.board[row][col] = '';
    }
  }

  console.log(`Player ${socket.id} made a move in room ${roomId}`, data);

  if (state.winner) {
    io.to(roomId).emit('gameOver', { winner: state.winner });
    delete sessions[roomId];
  } else {
    io.to(roomId).emit('currentState', state);
  }
};

const handleDisconnect = (socket, io) => {
  const roomId = socket.roomId;

  const index = waitingPlayers.indexOf(socket);
  if (index !== -1) {
    waitingPlayers.splice(index, 1);
    console.log(`Waiting player ${socket.id} disconnected`);
    return;
  }

  if (roomId && sessions[roomId]) {
    console.log(`Player ${socket.id} left the game in room ${roomId}`);

    socket.to(roomId).emit('playerLeft');

    delete sessions[roomId];
  }
};

module.exports = {
  handleJoin,
  handleMove,
  handleDisconnect
};
