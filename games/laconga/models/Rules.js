class Rules {
  constructor(score, timePerPlayer) {
    this._score = score;
    this._timePerPlayer = timePerPlayer;
  }

  get minPlayers() {
    return this.minPlayers;
  }

  get timePerPlayer() {
    return this._timePerPlayer;
  }

  get score() {
    return this._score;
  }
}

module.exports = Rules;
