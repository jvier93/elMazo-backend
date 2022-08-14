const Card = require("./Card");

class Table {
  constructor() {
    this._cards = [];
  }

  get cards() {
    return this._cards;
  }

  set cards(newCards) {
    this._cards = newCards;
  }

  //Añade una carta a la mesa
  addCard(cardToAdd) {
    let newCards = this.cards.slice();
    const card = new Card(cardToAdd[0]._number, cardToAdd[0]._suit); //creo una carta con los datos de la carta recibida (utilizo [0] ya que splice utilizado en el metodo donde consigo la carta a agregar me devuelve un array)

    newCards.push(card); //agrego esa carta a mi array de cartas
    this.cards = newCards;
  }

  //Remueve una carta de la mesa y la devuelva la ultima
  removeCard() {
    let newCards = this.cards.slice();

    const cardRemoved = newCards.pop();

    this.cards = newCards;
    return cardRemoved;
  }
}

module.exports = Table;
