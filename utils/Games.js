const Game = require("./../games/laconga/models/Game");

const games = [];

function createGame(nameRoom, gamePassword = "", points, timePerPlayer) {
  const laconga = new Game(nameRoom, gamePassword, points, timePerPlayer);

  games.push({ game: laconga, timer: null });

  return laconga;
}

//Busca y retorna el game que se encuentra en el array de games correspondiente a esa rrom, si no lo encuentra retorna null.
function getGame(room) {
  const indexCurrentGame = games.findIndex((gameRoom) => {
    return gameRoom.game._gameName === room;
  });
  if (indexCurrentGame !== -1) {
    return games[indexCurrentGame];
  } else {
    return null;
  }
}

function getAllGames() {
  const gamesData = [];
  //Recorro el array de games, y solo me quedo con los datos del juego que estan en game.
  games.forEach((game) => {
    gamesData.push(game.game);
  });
  return gamesData;
}

function removeGame(room) {
  const index = games.findIndex((game) => {
    return game.game._gameName === room;
  });

  if (index !== -1) {
    games.splice(index, 1)[0];
  }
}

function startTimer(timerTo, socketIoObject) {
  const gameData = getGame(timerTo);

  let timeInSeconds = gameData.game.rules.timePerPlayer;
  const timer = setInterval(() => {
    socketIoObject.to(timerTo).emit("updateTimer", {
      timeInSeconds,
      message: `Juega: ${
        gameData.game._players[gameData.game._indexOfPlayerTurn]._name
      } `,
    });

    if (timeInSeconds === 0) {
      timeInSeconds = gameData.game.rules.timePerPlayer;
      gameData.game.setTurn();
      socketIoObject
        .to(timerTo)
        .emit(
          "updatePlayers",
          gameData.game._players,
          gameData.game._gameStatus
        );
      socketIoObject.to(timerTo).emit("updateTimer", {
        timeInSeconds,
        message: `Juega: ${
          gameData.game._players[gameData.game._indexOfPlayerTurn]._name
        } `,
      });
    }

    timeInSeconds -= 1;
  }, 1000);
  gameData.timer = timer;
}

function stopTimer(gameToRemoveTimer, socketIoObject) {
  const gameData = getGame(gameToRemoveTimer);
  clearInterval(gameData.timer);
  socketIoObject
    .to(gameToRemoveTimer)
    .emit("updateTimer", { timeInSeconds: "", message: "" });
}

module.exports = {
  createGame,
  removeGame,
  getGame,
  getAllGames,
  startTimer,
  stopTimer,
};
