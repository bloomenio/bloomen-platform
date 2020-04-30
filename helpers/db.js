const mongoose = require("mongoose");
require("dotenv").config();

const connectionURL = process.env.CONNECTION_URL;

/* istanbul ignore next */
function connect() {
  console.log("db connecting...");
  return mongoose.connect(connectionURL, {
    // useUnifiedTopology: true,
    // useNewUrlParser: true,
    config: {
      autoIndex: true,
    },
  });
}

/* istanbul ignore next */
function errorHandler(schema) {
  schema.post("save", (error, doc, next) => {
    if (error.name === "MongoError" && error.code === 11000) {
      const field = error.message.split(".$")[1].split("_1")[0];
      const value = error.message.split("{ : ")[1].split(" }")[0];
      next({
        status: 409,
        error: "An entry with " + field + " " + value + " already exists.",
      });
    } else {
      next();
    }
  });
}

const db = {
  connect: connect,
  errorHandler: errorHandler,
};

module.exports = db;
