function nspElTruco(io) {
  const nsp = io.of("/ElTruco");
  nsp.on("connection", (socket) => {
    console.log("Un usuario se ha conectado...");

    //Run when client disconnects
    socket.on("disconnect", () => {
      console.log("desconectado del nsp el truco");
    });
  });
}

module.exports = nspElTruco;
