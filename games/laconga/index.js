const formatMessage = require("./../../utils/messages");
const {
  userJoin,
  createUser,
  getCurrentUser,
  userLeave,
} = require("./../../utils/Users");
const {
  createGame,
  getGame,
  getAllGames,
  removeGame,
} = require("./../../utils/Games");

function nspLaConga(io) {
  const nsp = io.of("/LaConga");

  nsp.on("connection", (socket) => {
    console.log("Un usuario se ha conectado...");

    socket.on("createUser", (nombre) => {
      const user = createUser(socket.id, nombre);
      socket.join(user.room);
      socket.emit("updateUserRoom", user.room);

      //Para obtener la lista de rooms existente
      const games = getAllGames();

      socket.emit("updateRoomsList", games);
      socket.emit(
        "message",
        formatMessage(
          "server bot",
          `Bienvenido a la sala principal ${user.username}!`
        )
      );
    });

    socket.on("createGame", ({ gameName, gameOverScore, timePerPlayer }) => {
      const user = getCurrentUser(socket.id); //buscamos el usuario
      const currentGame = getGame(gameName); //buscamos el game

      //si no existe un game
      if (!currentGame) {
        //Creamos un game y le añadimos el user como nuevo player

        const laConga = createGame(nsp, gameName, gameOverScore, timePerPlayer);

        laConga.addPlayer(user);
        //Con esta funcion hacemos admin a ese primer jugador
        laConga.checkAdmin();

        //Añadimos el player a la room para ese game tanto en socketio como en users
        socket.join(gameName);
        userJoin(socket.id, gameName);

        //decimos que le avise al cliente que la room del usuario ha cambiado
        nsp.to(user.room).emit("updateUserRoom", user.room);

        //Para obtener la lista de rooms existente
        const games = getAllGames();

        nsp.emit("updateGamesList", games);

        //Bienvenida a mi usuario
        socket.emit(
          "message",
          formatMessage("server bot", `Bienvenido al juego ${user.username}!`)
        );

        //Broadcast de bienvenida a los demas
        socket.broadcast
          .to(gameName)
          .emit(
            "message",
            formatMessage("server bot", `${user.username} se ha unido al juego`)
          );

        nsp.to(gameName).emit("updateDeck", laConga.deck);
        nsp
          .to(gameName)
          .emit("updatePlayers", laConga.players, laConga._gameStatus);
      } else {
        //Avisamos que ya existe un juego con ese nombre
        socket.emit(
          "message",
          formatMessage("server bot", `Ya existe un juego con ese nombre`)
        );
      }
    });

    socket.on("getGamesList", () => {
      const games = getAllGames();
      socket.emit("updateGamesList", games);
    });

    //Evento cuando un jugador se une a una room de juego
    socket.on("joinGame", (gameName) => {
      const user = getCurrentUser(socket.id); //buscamos el usuario
      const gameToJoin = getGame(gameName); //buscamos el game al que queremos unirnos

      if (gameToJoin) {
        if (gameToJoin.players.length < 4) {
          if (gameToJoin.wasStarted === true) {
            //Avisamos que el juego no esta en pausa
            socket.emit(
              "message",
              formatMessage("server bot", `Este juego ya comenzo`)
            );
            return;
          }

          gameToJoin.addPlayer(user);

          //Añadimos el player a ese game tanto en socketio como en users
          socket.leave("#000");
          socket.join(gameName);
          userJoin(socket.id, gameName);

          //decimos que le avise al cliente que la room del usuario ha cambiado
          nsp.to(user.room).emit("updateUserRoom", user.room);

          //Para obtener la lista de rooms existente
          const games = getAllGames();
          nsp.emit("updateGamesList", games);

          //Bienvenida a mi usuario
          socket.emit(
            "message",
            formatMessage("server bot", `Bienvenido al juego ${user.username}!`)
          );

          //Broadcast de bienvenida a los demas
          socket.broadcast
            .to(gameName)
            .emit(
              "message",
              formatMessage(
                "server bot",
                `${user.username} se ha unido al juego`
              )
            );

          nsp.to(gameName).emit("updateDeck", gameToJoin.deck);

          //quitar luego
          // if (gameToJoin.players.length === 4) gameToJoin.prepareRound();
          nsp
            .to(gameName)
            .emit("updatePlayers", gameToJoin.players, gameToJoin._gameStatus);
        } else {
          //Avisamos que ya se alcanzo el limite de players
          socket.emit(
            "message",
            formatMessage("server bot", `Se llego al limite de players`)
          );
        }
      } else {
        //Avisamos que no existe esa room
        socket.emit(
          "message",
          formatMessage("server bot", `No existe ese juego`)
        );
      }
    });

    //Evento para preparar la mesa para el juego (limpiar la mesa, crear una nueva baraja, y repartir las cartas a los jugadores) a fin de que este pronta para iniciar el juego
    socket.on("prepareRound", () => {
      console.log("se ejecuta prepare round");
      const user = getCurrentUser(socket.id);
      const laConga = getGame(user.room);

      //Si el juego esta iniciado notificarlo y retronar
      if (laConga.gameStatus === "iniciado") {
        return nsp
          .to(user.room)
          .emit(
            "message",
            formatMessage("server bot", `El juego ya ha iniciado`)
          );
      }

      //Si en el juego no hay players suficientes notificamos y retornamos
      if (laConga.players.length <= 1) {
        return nsp
          .to(user.room)
          .emit(
            "message",
            formatMessage(
              "server bot",
              `Debe haber mas de un jugador para iniciar`
            )
          );
      }

      //Si el juego ya ha sido ganado notificamos y retornamos
      if (laConga.hasWinPlayer(laConga.rules.gameOverScore)) {
        return nsp
          .to(user.room)
          .emit(
            "message",
            formatMessage("server bot", `El juego ha terminado, hay un ganador`)
          );
      }

      //Si no iniciamos el juego
      laConga.prepareRound();

      //Actualizamos la lista de rooms
      const games = getAllGames();
      nsp.emit("updateRoomsList", games);

      nsp
        .to(user.room)
        .emit("message", formatMessage("server bot", `El juego ha comenzado!`));
      nsp.to(user.room).emit("updateDeck", laConga.deck);
      nsp.to(user.room).emit("updateTable", laConga.table);
      nsp.to(user.room).emit("updateCutTable", laConga.cutTable);
      nsp.to(user.room).emit("showFrontCards", false);
      nsp.to(user.room).emit("updateGameStatus", laConga._gameStatus);
      nsp
        .to(user.room)
        .emit("updatePlayers", laConga.players, laConga._gameStatus);
    });

    //Evento cuando se pasan las cartas que estan en la mesa a la baraja
    socket.on("cardsForTableToDeck", () => {
      const user = getCurrentUser(socket.id);
      const room = user.room;
      const laConga = getGame(room);

      if (laConga._gameStatus === "pausa") {
        return;
      }

      laConga.tableToDeck();
    });

    //Evento cuando se levanta una carta de la baraja
    socket.on("raiseCard", () => {
      const user = getCurrentUser(socket.id);
      const room = user.room;
      const laConga = getGame(room);

      if (laConga._gameStatus === "pausa") {
        return;
      }

      const player = laConga.findPlayer(socket.id);

      if (player.inTurn && player.hand.length === 7) {
        player.recieveCard(laConga.deck.dealOne());
        laConga.findAndBuildGames(socket.id);
        nsp
          .to(user.room)
          .emit("updatePlayers", laConga.players, laConga._gameStatus);

        if (laConga.deck.cards.length === 0) {
          laConga.tableToDeck();
          nsp.to(user.room).emit("updateDeck", laConga.deck);
          nsp.to(user.room).emit("updateTable", laConga.table);
          nsp
            .to(user.room)
            .emit(
              "message",
              formatMessage(
                "server bot",
                "Se transfirio de la mesa a la baraja"
              )
            );
        } else {
          nsp.to(user.room).emit("updateDeck", laConga.deck);
        }
      } else {
        socket.emit(
          "message",
          formatMessage(
            "server bot",
            `Debe ser su turno y tener 7 cartas para levantar una`
          )
        );
      }
    });

    //Evento cuando se levanta una carta de la mesa
    socket.on("raiseTableCard", () => {
      const user = getCurrentUser(socket.id);
      const room = user.room;
      const laConga = getGame(room);

      if (laConga._gameStatus === "pausa") {
        return;
      }

      const player = laConga.findPlayer(socket.id);

      if (player.inTurn && player.hand.length === 7) {
        player.recieveCard(laConga.table.removeCard());
        laConga.findAndBuildGames(socket.id);
        nsp
          .to(user.room)
          .emit("updatePlayers", laConga.players, laConga._gameStatus);
        nsp.to(user.room).emit("updateTable", laConga.table);
      } else {
        socket.emit(
          "message",
          formatMessage(
            "server bot",
            `Debe ser su turno y tener 7 cartas para levantar una`
          )
        );
      }
    });

    //Evento cuando se "corta" el juego
    socket.on("cutGame", (indexOfCardToCutGame) => {
      const notifyWinOrLose = function ({ nsp, game, user }) {
        const scoreLimit = game.rules.gameOverScore;

        const extractPointsDetailOfPlayers = function (players, scoreLimit) {
          const playersDetail = [];
          players.forEach((player) => {
            playersDetail.push({
              socketId: player._socketId,
              name: player._name,
              score: player._score,
              scoreLimit,
            });
          });
          return playersDetail;
        };

        const playersDetail = extractPointsDetailOfPlayers(
          game.players,
          scoreLimit
        );
        const gameHasWinPlayer = game.hasWinPlayer(scoreLimit);

        if (gameHasWinPlayer) {
          //Si hay un ganador queremos brindar un mensaje "personalizado al que gano"

          //buscamos el player ganador la variables a continuacion guardan su detalle
          let playerWinner = game.players.find((player) => {
            return player.score < scoreLimit;
          });
          let playerWinnerSocketId = playerWinner.socketId;
          let playerWinnerName = playerWinner.name;

          //recorremos este array que contiene a todos los players en este juego
          game.players.forEach((player) => {
            //si el player que estamos procesando en este step concide con el que gano el juego
            if (player.socketId === playerWinnerSocketId) {
              //le enviamos un mensaje personalizado.
              nsp.to(player.socketId).emit("playerNotification", {
                showModal: true,
                modalMessage: {
                  title: "Has ganado el juego",
                  body: "pulsa aceptar para volver a la sala principal",
                },
                scoreDetails: playersDetail,
                modalMode: "endGameNotification",
              });
              //al resto le enviamos un mensaje con el nombre del ganador.
            } else {
              nsp.to(player.socketId).emit("playerNotification", {
                showModal: true,
                modalMessage: {
                  title: `${playerWinnerName} ha ganado el juego`,
                  body: "pulsa aceptar para volver a la sala principal",
                },
                scoreDetails: playersDetail,
                modalMode: "endGameNotification",
              });
            }
          });

          return;
        }

        game.players.map((player) => {
          if (player.score >= scoreLimit) {
            nsp.to(player.socketId).emit("playerNotification", {
              showModal: true,
              modalMessage: {
                title: `${user.username} gano esta ronda`,
                body: `llegaste al limite de puntos - ${scoreLimit} puedes salir pulsando aceptar`,
              },
              scoreDetails: playersDetail,
              modalMode: "endRoundNotification",
            });
          } else {
            nsp.to(player.socketId).emit("playerNotification", {
              showModal: true,
              modalMessage: {
                title: `${user.username} gano esta ronda`,
                body: "",
              },
              scoreDetails: playersDetail,
              modalMode: "endRoundNotification",
            });
          }
        });
      };

      const user = getCurrentUser(socket.id);

      const room = user.room;
      const laConga = getGame(room);

      const player = laConga.findPlayer(socket.id);
      //Si es el turno del jugador este tiene dos juegos y en su mano hay 8 cartas
      if (
        player.inTurn &&
        player.games.length === 2 &&
        player.hand.length === 8
      ) {
        //Tiramos la carta con la cual cortamos a la mesa de corte (cutTable)
        laConga.table.addCard(player.playCard(indexOfCardToCutGame));
        //Contamos los puntos
        laConga.scorePoints();
        laConga.stopTimer();
        laConga.gameStatus = "pausa";

        notifyWinOrLose({ nsp, game: laConga, user });

        //Actualizamos las vistas
        nsp.to(user.room).emit("updateGameStatus", laConga._gameStatus);
        nsp
          .to(user.room)
          .emit("updatePlayers", laConga.players, laConga._gameStatus);
        nsp.to(user.room).emit("showFrontCards", true);

        //Actualizamos la lista de rooms ya que el juego se pauso (el estado del juego lo mostramos en la lista de rooms)
        const games = getAllGames();
        nsp.emit("updateRoomsList", games);
      }
    });

    //Evento cuando se juega (se tira) una carta
    socket.on("playCard", (playedCardIndex) => {
      const user = getCurrentUser(socket.id);
      const room = user.room;
      const laConga = getGame(room);

      if (laConga._gameStatus === "pausa") {
        return;
      }

      const player = laConga.findPlayer(socket.id);
      //Si es el turno del jugador y en su mano hay 8 cartas
      if (player.inTurn && player.hand.length === 8) {
        //Llamo a la funciones que corresponden con jugar una carta
        //añado una carta a la mesa, cual? la que el jugador quiere tirar
        laConga.table.addCard(player.playCard(playedCardIndex));
        //Evaluamos si existen juegos en el orden que quedaron las cartas
        laConga.findAndBuildGames(socket.id);

        //Si el juego no tiene un unico jugador reseteamos el timer y cambiamos de turno, si no no tendria sentido.
        if (laConga._players.length !== 1) {
          //Si el juego esta preparado quiere decir que no se esta jugando asi que solo deberemos cambiar el turno iniciar el contador y cambiar el estado del juego a iniciado.
          if (laConga._gameStatus === "preparado") {
            laConga.setTurn();
            laConga.startTimer();
            laConga._gameStatus = "iniciado";
          } else if (laConga._gameStatus === "iniciado") {
            laConga.stopTimer();
            laConga.setTurn();

            laConga.startTimer();
          }
        }

        //Actualizamos las vistas
        nsp.to(user.room).emit("updateGameStatus", laConga._gameStatus);
        nsp
          .to(user.room)
          .emit("updatePlayers", laConga.players, laConga._gameStatus);
        nsp.to(user.room).emit("updateTable", laConga.table);
        nsp
          .to(user.room)
          .emit(
            "message",
            formatMessage(
              "server bot",
              `turno de ${laConga.players[laConga.indexOfPlayerTurn].name} `
            )
          );
      } else {
        socket.emit(
          "message",
          formatMessage("server bot", `Debe tener 8 cartas para tirar una`)
        );
      }
    });

    //Evento cuando ordenamos cartas en nuestra mano
    socket.on("reorderCards", (cartas) => {
      const room = getCurrentUser(socket.id).room;
      const laConga = getGame(room);
      laConga.sortPlayerCards(socket.id, cartas);
      laConga.findAndBuildGames(socket.id);

      socket.emit("updateMyHand", laConga.players);
    });

    socket.on("playerLeave", () => {
      const user = getCurrentUser(socket.id);
      playerLeave(user, true);
    });

    function playerLeave(user, leaveNoDisconnect) {
      const userRoom = user.room;
      if (userRoom !== "#000") {
        //Busco la instancia en la que estaba participando
        const currentGame = getGame(userRoom);

        if (currentGame._gameStatus !== "pausa") {
          //Si el jugador que se fue tenia el turno o era mano debemos setear de nuevo estos valores al siguiente jugador en la instancia ("lista"), ANTES de eliminarlo de la misma
          if (
            currentGame._players[currentGame._indexOfPlayerTurn]._socketId ===
              user.id &&
            currentGame._players.length > 1
          ) {
            currentGame.stopTimer();

            currentGame.removePlayer(user.id);
            currentGame.setHand();
            currentGame.setTurn();

            currentGame.startTimer();
          } else {
            currentGame.removePlayer(user.id);
            currentGame.setHand();
          }
        }
        if (currentGame._gameStatus === "pausa") {
          currentGame.removePlayer(user.id);
          currentGame.setHand();
        }

        if (leaveNoDisconnect) {
          socket.leave(userRoom);
          socket.join("#000");
          userJoin(user.id, "#000");
          socket.emit("updateUserRoom", "#000");
        }

        //Si la instancia de juego tiene mas de un player:
        if (currentGame._players.length > 1) {
          //no sabemos si el jugador que se desconecto es el admin, por ello chequeamos y hacemos admin al primero
          currentGame.checkAdmin();

          //Actualizamos la baraja ya que las cartas que tenia el jugador volvieron a la baraja
          nsp.to(userRoom).emit("updateDeck", currentGame.deck);
          //Actualizamos la vista de los jugadores que aun quedan en esta estancia
          nsp
            .to(userRoom)
            .emit(
              "updatePlayers",
              currentGame.players,
              currentGame._gameStatus
            );
          nsp
            .to(userRoom)
            .emit(
              "message",
              formatMessage(
                "server bot",
                `${user.username} se ha ido de la sala`
              )
            );

          //Actualizamos la lista de rooms ya que se hicieron cambios
          const games = getAllGames();
          nsp.emit("updateRoomsList", games);
        } else if (currentGame._players.length === 1) {
          //Detenemos el timer ¿para que querriamos uno si estamos solos en la sala? y tambien pausamos el juego, solo no vamos a jugar.
          currentGame.stopTimer();
          currentGame._gameStatus = "pausa";
          //Para este caso cambiamos a que el juego no fue iniciado asi se pueden sumar nuevos jugadores y reseteamos los puntos de jugadores
          currentGame._wasStarted = false;
          currentGame.resetPlayersScore();
          //no sabemos si el jugador que se desconecto es el admin, por ello chequeamos y hacemos admin al primero
          currentGame.checkAdmin();

          //Actualizamos la baraja ya que las cartas que tenia el jugador volvieron a la baraj
          nsp.to(userRoom).emit("updateDeck", currentGame.deck);
          //Enviamos la actualizacion de estado del game
          nsp.to(userRoom).emit("updateGameStatus", currentGame._gameStatus);
          //Actualizamos la vista de los jugadores que aun quedan en esta estancia
          nsp
            .to(userRoom)
            .emit(
              "updatePlayers",
              currentGame.players,
              currentGame._gameStatus
            );
          nsp
            .to(userRoom)
            .emit(
              "message",
              formatMessage(
                "server bot",
                `${user.username} se ha ido de la sala`
              )
            );

          //Actualizamos la lista de rooms ya que se hicieron cambios
          const games = getAllGames();
          nsp.emit("updateRoomsList", games);

          //Si el juego no tiene players no vale la pena hacer nada mas que removerlo
        } else if (currentGame._players.length === 0) {
          removeGame(userRoom);
          //Actualizamos la lista de games ya que se elimino uno
          const games = getAllGames();
          nsp.emit("updateRoomsList", games);
        }
      }
    }

    //Evento cuando un usuario se desconecta
    socket.on("disconnect", () => {
      console.log("Un usuario se ha desconectado...");
      const user = userLeave(socket.id); //Elimino al user del array de users, la funcion tambien lo devuelve

      if (user) {
        playerLeave(user);
      }
    });
  });
}

module.exports = nspLaConga;
