class Rules {
  constructor(gameOverScore, timePerPlayer) {
    this._gameOverScore = gameOverScore;
    this._timePerPlayer = timePerPlayer;
  }

  get minPlayers() {
    return this.minPlayers;
  }

  get timePerPlayer() {
    return this._timePerPlayer;
  }

  get gameOverScore() {
    return this._gameOverScore;
  }
}

module.exports = Rules;
