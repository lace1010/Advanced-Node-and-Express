"use strict";
require("dotenv").config();
const express = require("express");
const fccTesting = require("./freeCodeCamp/fcctesting.js");

const passport = require("passport");
const session = require("express-session");
const myDB = require("./connection");
const ObjectID = require("mongodb").ObjectID; // Need this to make a query serch for a Mongo _id
const LocalStrategy = require("passport-local");
const { ppid } = require("process");

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

  app.route("/").get((req, res) => {
    res.render("pug", {
      title: "Connected to Database",
      message: "Please login",
      showLogin: true,
    });
  });

  app
    .route("/login")
    .post(
      passport.authenticate("local", { failureRedirect: "/" }),
      (req, res) => {
        res.redirect("/profile");
      }
    );

  // Check to make sure user is authenticated then render the profile page. ensureAuthenticated is made at bottom of code
  app.route("/profile").get(ensureAuthenticated, (req, res) => {
    res.render(process.cwd() + "/views/pug/profile");
  });

  // Need serialization and deserialization in this async function inside myDB()
  passport.serializeUser((user, done) => {
    done(null, user._id);
  });
  passport.deserializeUser((id, done) => {
    myDB.findOne({ _id: new ObjectID(id) }, (error, doc) => {
      done(null, doc);
    });
  });

  passport.use(
    new LocalStrategy((username, password, done) => {
      myDataBase.findOne({ username: username }, (error, user) => {
        console.log("User " + username + " attempted to log in.");
        if (error) return done(error);
        if (!user) return done(null, false); // If there is no user in myDb
        if (password !== user.password) return done(null, false); // If passwrod is not correct
        return done(null, user); // If user exist and password is correct return the user object
      });
    })
  );
}).catch((error) => {
  // This will display if we don't connect to database (example if string in .env is changed)
  app.route("/").get((req, res) => {
    res.render("pug", { title: error, message: "Unable to login" });
  });
});

// Add this middleware function that checks if a user is authenticated. (we need this to make sure not just anyone can type out "/login" at end of url and enter )
function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) return next(); // If true then go to next thing
  res.redirect("/"); // Else redirect to home page
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Listening on port " + PORT);
});
