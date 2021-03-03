"use strict";
require("dotenv").config();
const express = require("express");
const myDB = require("./connection");
const fccTesting = require("./freeCodeCamp/fcctesting.js");

const app = express();
// Express needs to know which template engine we are using
app.set("view engine", "pug");

fccTesting(app); //For FCC testing purposes
app.use("/public", express.static(process.cwd() + "/public"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.route("/").get((req, res) => {
  // I don't know why it is just pug/index.pug. views is not required. If we use "views/pug/index.pug" it will not work
  res.render("pug/index.pug", { title: "Hello", message: "Please login" });
  /* FCC example way is as follows 
  res.render(process.cwd() + '/views/pug/index', {title: 'Hello', message: 'Please login'}); */
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Listening on port " + PORT);
});
