"use strict";
require("dotenv").config();
const express = require("express");
const fccTesting = require("./freeCodeCamp/fcctesting.js");

const passport = require("passport");
const session = require("express-session");
const myDB = require("./connection");
const routes = require("./routes.js"); // passing all routes to this file to have clean code
const auth = require("./auth.js"); // passing all auth to this file to have clean code

const app = express();

// Needs to be after app as we are calling app into it's createServer()
const http = require("http").createServer(app);
const io = require("socket.io")(http);

const passportSocketIo = require("passport.socketio");
const cookieParser = require("cookie-parser");
const MongoStore = require("connect-mongo").default;
const URI = process.env.MONGO_URI;
const store = new MongoStore({ url: URI });

// Express needs to know which template engine we are using
app.set("view engine", "pug");

fccTesting(app); //For FCC testing purposes
app.use("/public", express.static(process.cwd() + "/public"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Setting up app to use session
app.use(
  session({
    secret: process.env.SESSION_SECRET, // Add SESSION_SECRET in .env and assign a random valu
    resave: true,
    saveUninitialized: true,
    cookie: { secure: false },
    key: "express.sid",
    store: store,
  })
);
app.use(passport.initialize());
app.use(passport.session());

myDB(async (client) => {
  const myDataBase = await client.db("database").collection("users");
  // Use next two lines so we can use module.export in other files to use app and myDataBase in them
  routes(app, myDataBase);
  auth(app, myDataBase);

  // To listen for connections to your server
  // (socket) is the socket variable in client.js
  io.use(
    passportSocketIo.authorize({
      cookieParser: cookieParser,
      key: "express.sid",
      secret: process.env.SESSION_SECRET,
      store: store,
      success: onAuthorizeSuccess,
      fail: onAuthorizeFail,
    })
  );

  let currentUsers = 0;
  io.on("connection", (socket) => {
    console.log("A user has connected");
    ++currentUsers;
    io.emit("user count", currentUsers); // Use io.emit because taking information from io and sending it to socket in client.js
    console.log("user " + socket.request.user.username + " connected");
    // use socket.on and not io.on because we use the parameter passed in this function listening for socket in client.js
    socket.on("disconnect", () => {
      console.log("A user has disconnected");
      --currentUsers;
      io.emit("user count", currentUsers);
    });
  });
}).catch((error) => {
  // This will display if we don't connect to database (example if string in .env is changed)
  app.route("/").get((req, res) => {
    res.render("pug", { title: error, message: "Unable to login" });
  });
});

const onAuthorizeSuccess = (data, accept) => {
  console.log("successful connection to socket.io");

  accept(null, true);
};

const onAuthorizeFail = (data, message, error, accept) => {
  if (error) throw new Error(message);
  console.log("failed connection to socket.io:", message);
  accept(null, false);
};

const PORT = process.env.PORT || 3000;
// Need to listen to http server now that http is mounted
http.listen(PORT, () => {
  console.log("Listening on port " + PORT);
});
