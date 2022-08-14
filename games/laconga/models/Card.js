class Card {
  constructor(number, suit) {
    this._suit = suit;
    this._number = number;
    this._imgBack = "./imagenesBaraja/reverso.gif";
    this._imgBack75 = "./imagenesBaraja/reverso75.gif";
    this._imgFront = `./imagenesBaraja/${suit}/${number}${suit.toLowerCase()}.png`;
    this._imgFront75 = `./imagenesBaraja/${suit}/${number}${suit}75.gif`;
    this._imgFrontGame = `./imagenesBaraja/${suit}/${number}${suit.toLowerCase()}-game.png`;
    this._inGame = "";
  }

  get inGame() {
    return this._inGame;
  }

  get suit() {
    return this._suit;
  }

  get number() {
    return this._number;
  }

  set inGame(newInGame) {
    this._inGame = newInGame;
  }
}

module.exports = Card;
