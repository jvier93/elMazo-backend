const Card = require("./Card");

class Deck {
  constructor() {
    this._cards = [];
  }

  get cards() {
    return this._cards;
  }

  set cards(newCards) {
    this._cards = newCards;
  }

  //crea una baraja
  buildDeck() {
    const values = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
    const suits = ["Oro", "Espada", "Basto", "Copa"];
    let cards = [];
    for (let suit of suits) {
      for (let value of values) {
        const card = new Card(value, suit);
        cards.push(card);
      }
    }
    this.cards = cards;
  }

  //Añade una carta a la baraja
  addCard(cardToAdd) {
    let newCards = this.cards.slice();
    newCards.push(cardToAdd);
    this.cards = newCards;
  }

  //Baraja las cartas
  shuffle() {
    let newCards = this.cards.slice();

    newCards.sort((a, b) => 0.5 - Math.random());
    this.cards = newCards;
  }

  //devuelve una carta, la ultima.
  dealOne() {
    let newCards = this.cards.slice();

    const cardToDeal = newCards.pop();
    this.cards = newCards;
    return cardToDeal;
  }
}

module.exports = Deck;
