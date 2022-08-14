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
  constructor(gameName, gamePassword = "", points, timePerPlayer) {
    this._gameName = gameName;
    this._gamePassword = gamePassword;
    this._players = [];
    this._deck = new Deck();
    this._table = new Table([]);
    this._cutTable = new CutTable([]);
    this._rules = new Rules(points, timePerPlayer);
    this._wasStarted = "false";
    this._gameStatus = "pausa"; //"iniciado" "pausa"
    this._indexOfPlayerTurn = 0;
    this._indexOfPlayerHand = 0;
  }

  //Getters

  get gamePassword() {
    return this._gamePassword;
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

  set gamePassword(newGamePassword) {
    this._gamePassword = newGamePassword;
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
  hasWinPlayer(scoreLimit) {
    if (this.players.length > 1) {
      let playersKeepPlaying = 0;
      this.players.map((player) => {
        if (player.score < scoreLimit) {
          playersKeepPlaying++;
        }
      });

      return playersKeepPlaying <= 1;
    } else {
      return false;
    }
  }

  startGame() {
    //Eliminamos las cartas de todos los lugares
    if (this._gameStatus === "pausa") {
      this.players.map((player) => {
        player.removeAllCards();
      });
      this.table = new Table([]);
      this.cutTable = new CutTable([]);
      this.deck = new Deck();

      //Armamos todo el juego de nuevo
      this.deck.buildDeck();
      //this.deck.shuffle();
      this.setHand();
      this.setTurn(this.indexOfPlayerTurn);
      this.dealCards();
      this.wasStarted = "true";
      this.gameStatus = "iniciado";
    }
  }

  //Añade un jugador al juego
  addPlayer({ username, id }) {
    const player = new Player(username, id);
    let newPlayers = this.players.slice();
    newPlayers.push(player);
    this.players = newPlayers;
  }

  //quita las cartas del jugador las pasa a la baraja y lo remueve del juego
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
    this.gameStatus = "iniciado";
    this.players.map((player, index) => {
      //si el jugado llego al limite de puntos establecios en rules, no le reparte, ese jugador quedo fuera.
      if (!(player.score >= this.rules.score)) {
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

  //Ordena las cartas de un jugador segun el nuevo orden pasado.
  sortPlayerCards(socketId, newOrder) {
    let indexJugador = this.players.findIndex((player) => {
      return player.socketId === socketId;
    });
    this.players[indexJugador].sortCards(newOrder);
  }

  //Cambia el turno
  setTurn(playerTurn = null) {
    if (playerTurn) {
      this.indexOfPlayerTurn = playerTurn;
      return;
    }
    const qtyOfPlayers = this.players.length - 1;

    if (this.players.length === 0) {
      return;
    }

    if (
      this.indexOfPlayerTurn >= qtyOfPlayers ||
      this.indexOfPlayerTurn === null
    ) {
      this.indexOfPlayerTurn = 0;
      for (let player of this.players) {
        player.inTurn = false;
      }
      this.players[this.indexOfPlayerTurn].inTurn = true;
    } else {
      this.indexOfPlayerTurn++;
      for (let player of this.players) {
        player.inTurn = false;
      }
      this.players[this.indexOfPlayerTurn].inTurn = true;
    }

    let playerInTurn = this.players[this.indexOfPlayerTurn];

    while (playerInTurn.score > 100) {
      if (
        this.indexOfPlayerTurn >= qtyOfPlayers ||
        this.indexOfPlayerTurn === null
      ) {
        this.indexOfPlayerTurn = 0;
        for (let player of this.players) {
          player.inTurn = false;
        }
        this.players[this.indexOfPlayerTurn].inTurn = true;
      } else {
        this.indexOfPlayerTurn++;
        for (let player of this.players) {
          player.inTurn = false;
        }
        this.players[this.indexOfPlayerTurn].inTurn = true;
      }

      playerInTurn = this.players[this.indexOfPlayerTurn];
    }
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
