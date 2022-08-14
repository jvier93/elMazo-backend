const users = [];

function createUser(id, username, room = "#000") {
  const user = { id, username, room, admin: false };
  users.push(user);

  return user;
}

//une al usuario a una room y checkea el admin en el game al que se ha unido siempre y cuando la room o game (llevan el mismo nombre por eso digo o) no sea #000 (la room base)
function userJoin(id, room) {
  const user = getCurrentUser(id);
  user.room = room;
  if (room !== "#000") {
    checkUserAdmin(room);
  }
  return user;
}

//Get current user
function getCurrentUser(id) {
  return users.find((user) => user.id === id);
}

//function de uso interno, setea un usuario admin, el primero q entra a la sala
function checkUserAdmin(room) {
  const index = users.findIndex((user) => {
    return user.room === room;
  }); //buscamos indice del primer usuario en la lista de rooms que pertenezca a la sala pasada

  users.map((user) => {
    if (user.room === room) {
      user.admin = false;
    }
  }); //a todos los usuarios que pertenezcan a la sala les colocamos admin en false
  if (index !== -1) {
    users[index].admin = true; //unicamente al ususario encontrado arriba (que es el primero en la sala) le ponemos admin = true
  }
}

//User leaves
function userLeave(id) {
  const index = users.findIndex((user) => {
    return user.id === id;
  });

  if (index !== -1) {
    const user = users.splice(index, 1)[0];

    if (users.length > 0) {
      checkUserAdmin(user.room);
    }

    return user;
  }
}

module.exports = {
  userJoin,
  createUser,
  getCurrentUser,
  userLeave,
};
