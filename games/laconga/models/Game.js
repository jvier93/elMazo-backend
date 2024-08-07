const Player = require("./Player");
const Rules = require("./Rules");
const Deck = require("./Deck");
const Table = require("./Table");
const CutTable = require("./CutTable");

//Se agrega jugadores
//se setea hand y turn
//se reparten las cartas

//comienza el juego

class Game {
  constructor(socketConnectionNsp, gameName, gameOverScore, timePerPlayer) {
    // Definimos la propiedad _socketConnectionNsp y _timer utilizando Object.defineProperty para evitar
    // que estas propiedades sean enumerables. Esto significa
    // que no aparecerán cuando el objeto sea convertido a JSON o cuando se itere sobre las
    // propiedades del objeto utilizando métodos como Object.keys() o for...in.
    //
    // Esto es importante porque los objetos como socket.io y timer contienen referencias cíclicas y
    // otros datos complejos que causan problemas durante la serialización. cuando envio el objeto de game entero hacia el front

    Object.defineProperty(this, "_socketConnectionNsp", {
      value: socketConnectionNsp,
      writable: true,
      configurable: true,
      enumerable: false, // Hacemos que la propiedad no sea enumerable
    });

    Object.defineProperty(this, "_timer", {
      value: socketConnectionNsp,
      writable: true,
      configurable: true,
      enumerable: false, // Hacemos que la propiedad no sea enumerable
    });
    this._gameName = gameName;
    this._gamePassword = "";
    this._timer = null;
    this._players = [];
    this._deck = new Deck();
    this._table = new Table([]);
    this._cutTable = new CutTable([]);
    this._rules = new Rules(gameOverScore, timePerPlayer);
    this._wasStarted = false;
    this._gameStatus = "pause"; //"running" "ready" "pause"
    this._indexOfPlayerTurn = 0;
    this._indexOfPlayerHand = 0;
  }

  //Getters

  get socketConnectionNsp() {
    return this._socketConnectionNsp;
  }

  get gamePassword() {
    return this._gamePassword;
  }

  get timer() {
    return this._timer;
  }

  get gameStatus() {
    return this._gameStatus;
  }

  get wasStarted() {
    return this._wasStarted;
  }

  get cutTable() {
    return this._cutTable;
  }

  get players() {
    return this._players;
  }

  get gameName() {
    return this._gameName;
  }

  get deck() {
    return this._deck;
  }

  get table() {
    return this._table;
  }

  get rules() {
    return this._rules;
  }

  get indexOfPlayerHand() {
    return this._indexOfPlayerHand;
  }

  get indexOfPlayerTurn() {
    return this._indexOfPlayerTurn;
  }

  //Setters

  set socketConnectionNsp(newSocketConnectionNsp) {
    this._socketConnectionNsp = newSocketConnectionNsp;
  }

  set gamePassword(newGamePassword) {
    this._gamePassword = newGamePassword;
  }

  set timer(newTimer) {
    this._timer = newTimer;
  }

  set gameStatus(newGameStatus) {
    this._gameStatus = newGameStatus;
  }

  set wasStarted(newWasStarted) {
    this._wasStarted = newWasStarted;
  }

  set players(newPlayers) {
    this._players = newPlayers;
  }

  set deck(newDeck) {
    this._deck = newDeck;
  }

  set cutTable(cards) {
    this._cutTable = cards;
  }

  set table(cards) {
    this._table = cards;
  }

  set deck(cards) {
    this._deck.cards = cards;
  }

  set indexOfPlayerTurn(newIndex) {
    this._indexOfPlayerTurn = newIndex;
  }

  set indexOfPlayerHand(newIndex) {
    this._indexOfPlayerHand = newIndex;
  }

  findPlayer(socketId) {
    const player = this.players.find((player) => {
      return player.socketId === socketId;
    });

    return player;
  }

  checkAdmin() {
    if (this.players.length > 0) {
      this.players[0].admin = true;
    }
  }

  //Metodo que evalua si existe un ganador en el juego (si solo un jugador tiene menos de 100 puntos)
  hasWinPlayer(gameOverScore) {
    if (this.players.length > 1) {
      let playersKeepPlaying = 0;
      this.players.map((player) => {
        if (player.score < gameOverScore) {
          playersKeepPlaying++;
        }
      });

      return playersKeepPlaying <= 1;
    } else {
      return false;
    }
  }

  startTimer() {
    let timeInSeconds = this._rules.timePerPlayer;

    //Antes de iniciar el timer en si enviamos el evento para visualizar en el frontend el primer "tic" de tiempo
    this._socketConnectionNsp.to(this._gameName).emit("updateTimer", {
      timeInSeconds,
    });

    const timer = setInterval(() => {
      timeInSeconds -= 1;

      this._socketConnectionNsp.to(this._gameName).emit("updateTimer", {
        timeInSeconds,
      });

      if (timeInSeconds === 0) {
        timeInSeconds = this._rules.timePerPlayer;
        this.setTurn();
        this._socketConnectionNsp
          .to(this._gameName)
          .emit("updatePlayers", this._players, this._gameStatus);

        this._socketConnectionNsp.to(this._gameName).emit("updateTimer", {
          timeInSeconds,
        });
      }
    }, 1000);
    this._timer = timer;
  }

  stopTimer() {
    clearInterval(this._timer);

    //Notificamos al frontend que se detuvo el timer
    this._socketConnectionNsp.to(this._gameName).emit("updateTimer", {
      timeInSeconds: "",
    });
  }

  prepareRound() {
    //Eliminamos las cartas de todos los lugares
    if (this._gameStatus === "pause") {
      this.players.map((player) => {
        player.removeAllCards();
      });
      this.table = new Table([]);
      this.cutTable = new CutTable([]);
      this.deck = new Deck();

      //Armamos todo el juego de nuevo
      this.deck.buildDeck();
      //Entreveramos las cartas 2 veces
      this.deck.shuffle();
      this.deck.shuffle();
      this.setHand();
      //El jugador que es mano es quien debe tener el turno al iniciar la ronda
      this.setTurn(this.indexOfPlayerHand);
      this.dealCards();
      this._wasStarted = true;
      this._gameStatus = "ready";
    }
  }

  //Añade un jugador al juego
  addPlayer({ username, id }) {
    const player = new Player(username, id);
    let newPlayers = this.players.slice();
    newPlayers.push(player);
    this.players = newPlayers;
  }

  //quita las cartas del jugador las pasa a la baraja y lo remueve del juego, tambien debe ajustar el indexOfPlayerTurn e indexOfPlayerHand para que no quede defasado con el nuevo array de jugadores.
  removePlayer(socketId) {
    this.playerCardsToDeck(socketId);
    this.deck.shuffle();
    const playerIndex = this.players.findIndex((player) => {
      return player.socketId === socketId;
    });

    if (playerIndex !== -1) {
      let newPlayers = this.players.slice();
      newPlayers.splice(playerIndex, 1);
      this.players = newPlayers;
    }

    if (playerIndex < this.indexOfPlayerTurn) {
      this.indexOfPlayerTurn--;
    }

    if (playerIndex < this.indexOfPlayerHand) {
      this.indexOfPlayerHand--;
    }
  }

  resetPlayersScore() {
    this._players.forEach((player) => {
      player._score = 0;
    });
  }

  //quita las cartas del jugador las pasa a la baraja
  playerCardsToDeck(playerId) {
    const players = this.players.slice();

    const player = players.find((player) => {
      return player.socketId === playerId;
    });

    while (player.hand.length > 0) {
      this.deck.addCard(player.removeCard());
    }
  }

  //reparte las cartas
  dealCards() {
    this.players.map((player, index) => {
      //si el jugado llego al limite de puntos establecios en rules, no le reparte, ese jugador quedo fuera.
      if (!(player.score >= this.rules.gameOverScore)) {
        //si el jugador es mano, le da 8 cartas
        if (this.indexOfPlayerHand === index) {
          while (player.hand.length < 8) {
            let card = this.deck.dealOne();
            player.recieveCard(card);
          }
          //si no le da 7 cartas
        } else {
          while (player.hand.length < 7) {
            let card = this.deck.dealOne();
            player.recieveCard(card);
          }
        }
      }
    });
  }

  findAndBuildGames(socketId) {
    let indexJugador = this.players.findIndex((player) => {
      return player.socketId === socketId;
    });
    this.players[indexJugador].findAndBuildGames();
  }

  //Ordena las cartas de un jugador segun el nuevo orden pasado (cuando el jugador cambia el orden de sus cartas en el front).
  sortPlayerCards(socketId, newOrder) {
    let indexJugador = this.players.findIndex((player) => {
      return player.socketId === socketId;
    });
    this.players[indexJugador].sortCards(newOrder);
  }

  //Version mejorada por chat gpt
  setTurn(playerTurn = null) {
    // Verifica que playerTurn no sea null y que sea un número válido
    if (typeof playerTurn === "number") {
      this.indexOfPlayerTurn = playerTurn;
    } else {
      // Si no se proporciona playerTurn, se incrementa el índice de turno
      this.indexOfPlayerTurn =
        (this.indexOfPlayerTurn + 1) % this.players.length;
    }

    // Asegúrate de que todos los jugadores no estén en turno
    this.players.forEach((player) => (player.inTurn = false));

    // Encuentra el próximo jugador con un score menor o igual a 100
    let playerInTurn = this.players[this.indexOfPlayerTurn];
    let steps = 0;
    while (playerInTurn.score > 100 && steps < this.players.length) {
      this.indexOfPlayerTurn =
        (this.indexOfPlayerTurn + 1) % this.players.length;
      playerInTurn = this.players[this.indexOfPlayerTurn];
      steps++;
    }

    // Establece el jugador actual en turno
    playerInTurn.inTurn = true;
  }

  //Cambia quien es mano
  setHand() {
    const qtyOfPlayers = this.players.length - 1;

    if (this.players.length === 0) {
      return;
    }

    if (
      this.indexOfPlayerHand >= qtyOfPlayers ||
      this.indexOfPlayerTurn === null
    ) {
      this.indexOfPlayerHand = 0;
      for (let player of this.players) {
        player.isHand = false;
      }
      this.players[this.indexOfPlayerHand].isHand = true;
    } else {
      this.indexOfPlayerHand += 1;
    }

    let playerIsHand = this.players[this.indexOfPlayerHand];

    let steps = 0;

    while (playerIsHand.score > 100) {
      if (steps >= this.players.length) {
        return;
      }
      if (
        this.indexOfPlayerHand === qtyOfPlayers ||
        this.indexOfPlayerTurn === null
      ) {
        this.indexOfPlayerHand = 0;
        for (let player of this.players) {
          player.isHand = false;
        }
        this.players[this.indexOfPlayerHand].isHand = true;
      } else {
        this.indexOfPlayerHand += 1;

        for (let player of this.players) {
          player.isHand = false;
        }
        this.players[this.indexOfPlayerHand].isHand = true;
      }
      playerIsHand = this.players[this.indexOfPlayerHand];

      steps = steps + 1;
    }
  }

  tableToDeck() {
    while (this.table.cards.length > 0) {
      this.deck.addCard(this.table.removeCard());
    }
    this.deck.shuffle();
  }

  //Calcula los puntos de los jugadores
  scorePoints() {
    this.players.map((player) => {
      player.addAndSetScore();
    });
  }
}

module.exports = Game;
