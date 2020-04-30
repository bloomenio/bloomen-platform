const express = require("express");
const path = require("path");
const favicon = require("serve-favicon");
const logger = require("morgan");
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
const cors = require("cors");
const timeout = require("connect-timeout");
const swagger = require("./helpers/swagger");

const jwt = require("./middlewares/jwt");
const jwtOptional = require("./middlewares/jwt-optional");

const db = require("./helpers/db");

const index = require("./controllers/index");
const wallet = require("./controllers/wallet");
const auth = require("./controllers/auth");
const users = require("./controllers/users");
const me = require("./controllers/me");
const photos = require("./controllers/photos");
const sound = require("./controllers/sound");
const webtv = require("./controllers/webtv");
const assets = require("./controllers/assets");
const transactions = require("./controllers/transactions");
const licenses = require("./controllers/licenses");
const invitations = require("./controllers/invitations");
const assignments = require("./controllers/assignments");
const organisations = require("./controllers/organisations");

const app = express();

swagger(app);

db.connect();

// enable cors
app.use(cors());

// increase default timeout
app.use(timeout(120000));

// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "jade");
app.use(express.static(__dirname + "/public"));

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger("dev"));
app.use(bodyParser.json({ limit: "10mb" }));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

app.use("/", index);

app.use("/auth", auth);
app.use("/assets", jwtOptional, assets);

// restricted access routes
app.use("/me", jwt, me);
app.use("/users", jwt, users);
app.use("/photos", jwt, photos);
app.use("/sound", jwt, sound);
app.use("/webtv", jwt, webtv);
app.use("/transactions", jwt, transactions);
app.use("/invitations", jwt, invitations);
app.use("/assignments", jwt, assignments);
app.use("/organisations", jwt, organisations);
app.use("/licenses", jwt, licenses);
app.use("/wallet", jwtOptional, wallet);

// swagger documentation
// app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next({ status: 404, error: "Route not found" });
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.error;
  res.locals.error = err;

  console.log("Server error:", err);

  // respond with error
  /* istanbul ignore next */
  res.status(err.status || 500).send(err);

  // render the error page
  // res.render("error");
});

module.exports = app;
