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
  app.route("/auth/github").get(passport.authenticate("github"));

  app
    .route("/auth/github/callback")
    .get(
      passport.authenticate("github", { failureRedirect: "/" }),
      (req, res) => {
        res.redirect("/profile");
      }
    );

  // GitHubStrategy authetication
  passport.use(
    new GitHubStrategy(
      {
        clientID: process.env.GITHUB_CLIENT_ID,
        clientSecret: process.env.GITHUB_CLIENT_SECRET,
        callbackURL:
          "https://advanced-node-express.herokuapp.com/auth/github/callback",
      },
      function (accessToken, refreshToken, profile, cb) {
        console.log(profile);
      }
    )
  );
}).catch((error) => {
  // This will display if we don't connect to database (example if string in .env is changed)
  app.route("/").get((req, res) => {
    res.render("pug", { title: error, message: "Unable to login" });
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Listening on port " + PORT);
});
