"use strict";
require("dotenv").config();
const express = require("express");
const fccTesting = require("./freeCodeCamp/fcctesting.js");

const passport = require("passport");
const session = require("express-session");
const myDB = require("./connection");
const routes = require("./routes.js"); // passing all routes to this file to have clean code
const auth = require("./auth.js"); // passing all auth to this file to have clean code
const http = require("http").createServer(app);
const io = require("socket.io")(http);

const app = express();
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
  io.on("connection", (socket) => {
    console.log("A user has connected");
  });
}).catch((error) => {
  // This will display if we don't connect to database (example if string in .env is changed)
  app.route("/").get((req, res) => {
    res.render("pug", { title: error, message: "Unable to login" });
  });
});

const PORT = process.env.PORT || 3000;
// Need to listen to http server now that http is mounted
app.listen(PORT, () => {
  console.log("Listening on port " + PORT);
});
