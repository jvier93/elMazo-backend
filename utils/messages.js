const moment = require("moment");

function formatMessage(username, text) {
  return {
    class: "pulse",
    text,
    time: moment().format("h:mm a"),
  };
}

module.exports = formatMessage;
