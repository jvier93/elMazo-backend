const Card = require("./Card");

class Player {
  constructor(name, socketId) {
    this._name = name;
    this._socketId = socketId;
    this._hand = [];
    this._games = [];
    this._score = 0;
    this._isHand = false;
    this._inTurn = false;
    this._admin = false;
  }

  //Getters
  get admin() {
    return this._admin;
  }

  get isHand() {
    return this.isHand;
  }

  get inTurn() {
    return this._inTurn;
  }

  get name() {
    return this._name;
  }

  get socketId() {
    return this._socketId;
  }

  get hand() {
    return this._hand;
  }

  get games() {
    return this._games;
  }

  get score() {
    return this._score;
  }
  //Setters

  set admin(newAdmin) {
    this._admin = newAdmin;
  }

  set isHand(newIsHand) {
    this._isHand = newIsHand;
  }

  set inTurn(newInTurn) {
    this._inTurn = newInTurn;
  }

  set hand(newHand) {
    this._hand = newHand;
  }

  set games(newGames) {
    this._games = newGames;
  }

  set score(newScore) {
    this._score = newScore;
  }

  //Juega una carta
  playCard(cardIndex) {
    let hand = this.hand.slice();
    const playedCard = hand.splice(cardIndex, 1); //devolver carta eliminada
    playedCard._inGame = ""; //decimos que esa carta no pertenece a ningun juego
    this.hand = hand;

    return playedCard;
  }

  //Ordenar cartas en mano
  sortCards(newOrder) {
    this.hand = newOrder;
  }

  //Remueve todas las cartas de la mano
  removeAllCards() {
    //Removemos los juegos del player ya que estan directamente relacionado con sus cartas
    this.games.length = 0;

    this.hand.length = 0;
  }

  //Remueve una carta y la retorna (la ultima)
  removeCard() {
    let hand = this.hand.slice();
    const cardToRemove = hand.pop();
    cardToRemove._inGame = ""; //decimos que esa carta no pertenece a ningun juego
    this.hand = hand;
    return cardToRemove;
  }

  //recibir una carta.
  recieveCard(card) {
    let newHand = this.hand.slice();
    newHand.push(card);
    this.hand = newHand;
  }

  //Busca y crea juegos en la mano actual del jugador.
  findAndBuildGames() {
    //devuelve este juego ya existe? recibe un juego y un array de juegos en el cual buscar
    function gameExists(newGame, playerGames) {
      if (playerGames) {
        for (var game of playerGames) {
          for (let index of newGame.indices) {
            if (game.indices.includes(index)) {
              return true;
            }
          }
        }
      }
    }

    //retorna hay juego de palos?
    function suitOfNumbers(index, hand) {
      const card1 = hand[index]._number;
      const card2 = hand[index + 1]._number;
      const card3 = hand[index + 2]._number;

      return card1 === card2 && card1 === card3;
    }
    //devuelve un juego de palos
    function buildNumberGame(index) {
      return { name: "juegoDeNumeros", indices: [index, index + 1, index + 2] };
    }

    //devuelve un juego de numeros
    function buildSuitGame(index, length) {
      if (length === 4) {
        return {
          name: "juegoDePalos",
          indices: [index, index + 1, index + 2, index + 3],
        };
      }

      return {
        name: "juegoDePalos",
        indices: [index, index + 1, index + 2],
      };
    }

    //devuelve hay juego de numeros?
    function suitOfSuits(index, hand) {
      const card1 = hand[index]._suit;
      const card2 = hand[index + 1]._suit || null;
      const card3 = hand[index + 2]._suit || null;
      const card4 =
        hand[index + 3] !== undefined ? hand[index + 3]._suit : null;

      const card1Number = hand[index]._number || null;
      const card2Number = hand[index + 1]._number || null;
      const card3Number = hand[index + 2]._number || null;
      const card4Number =
        hand[index + 3] !== undefined ? hand[index + 3]._number : null;

      if (card1 === card2 && card1 === card3 && card1 === card4) {
        //Puede parecer una mala practica hacer lo siguiente en vez de simplemente retornar la comprobacion, el tema es que no quiero retornar en caso de false
        //si no hacer la siguiente comprobacion
        if (
          card1Number + 1 === card2Number &&
          card2Number + 1 === card3Number &&
          card3Number + 1 === card4Number
        ) {
          return { game: true, length: 4 };
        }
      }

      if (card1 === card2 && card1 === card3) {
        if (
          card1Number + 1 === card2Number &&
          card2Number + 1 === card3Number
        ) {
          return { game: true, length: 3 };
        }
      }

      return { game: false, length: null };
    }

    const playerGames = [];

    for (let i = 0; i < this.hand.length - 2; i++) {
      let newGameSuits = "";
      let newGameNumber = "";
      if (suitOfNumbers(i, this.hand)) {
        newGameSuits = buildNumberGame(i);
      }

      const { game, length } = suitOfSuits(i, this.hand);
      if (game) {
        newGameNumber = buildSuitGame(i, length);
      }

      if (newGameSuits !== "") {
        !gameExists(newGameSuits, playerGames)
          ? playerGames.push(newGameSuits)
          : null;
      } else if (newGameNumber !== "") {
        !gameExists(newGameNumber, playerGames)
          ? playerGames.push(newGameNumber)
          : null;
      }
    }

    if (playerGames.length > 0) {
      this.games = playerGames;
    } else {
      this.games = [];
    }
    /////////////////
    this.hand.map((card) => {
      card._inGame = "";
    });

    for (let game of this.games) {
      game.indices.map((indice) => {
        this.hand[indice]._inGame = game.name;
      });
    }
  }

  //Nos devuelve un booleano de si este player esta habilitdo para seguir en juego, y nos devuelve su puntaje
  thisPlayerCanPlay() {
    return { canPlay: this.score < 100, score: this.score };
  }

  //cuenta los puntos y los setea en score del jugador.
  addAndSetScore() {
    let score = this.score;

    this.hand.map((card) => {
      if (!card._inGame) {
        score = score + card._number;
      }
    });

    this.score = score;
  }
}

module.exports = Player;
