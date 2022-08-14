class Timer {
  constructor(func) {
    this._count = 2;
    //referencia al game, para poder usar su funcion setTurn()
    this._game = game;
    //registramos aqui el interval (su id) asi podemos hacer un clear inverval
    this._interval;

    this._players;
  }

  get game() {
    return this._game;
  }

  get count() {
    return this._count;
  }

  get interval() {
    return this._interval;
  }

  set interval(newInterval) {
    this._interval = newInterval;
  }

  set count(newCount) {
    this._count = newCount;
  }

  startTimer() {
    this.interval = setInterval(() => {
      if (this._count === 0) {
        this.restartTimer();
      }
      this.count--;
    }, 1000);
  }
  stopTimer() {
    clearInterval(this.interval);
  }
  restartTimer() {
    this._count = 10;
  }
}

module.exports = Timer;
