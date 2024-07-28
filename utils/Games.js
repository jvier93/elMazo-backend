const Game = require("./../games/laconga/models/Game");

const games = [];

function createGame(
  socketConnectionNsp,
  nameRoom,
  gameOverScore,
  timePerPlayer
) {
  const laConga = new Game(
    socketConnectionNsp,
    nameRoom,
    gameOverScore,
    timePerPlayer
  );

  games.push(laConga);

  return laConga;
}

//Busca y retorna el game que se encuentra en el array de games correspondiente a esa room, si no lo encuentra retorna null.
function getGame(room) {
  const indexCurrentGame = games.findIndex((game) => {
    return game._gameName === room;
  });
  if (indexCurrentGame !== -1) {
    return games[indexCurrentGame];
  } else {
    return null;
  }
}

function getAllGames() {
  return games;
}

function removeGame(room) {
  const index = games.findIndex((game) => {
    return game._gameName === room;
  });

  if (index !== -1) {
    games.splice(index, 1)[0];
  }
}

module.exports = {
  createGame,
  removeGame,
  getGame,
  getAllGames,
};
