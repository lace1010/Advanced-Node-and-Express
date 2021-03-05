require("dotenv").config();
const passport = require("passport");
const bcrypt = require("bcrypt");
const LocalStrategy = require("passport-local");
const ObjectID = require("mongodb").ObjectID; // Need this to make a query serch for a Mongo _id

module.exports = function (app, myDataBase) {
  // Need serialization and deserialization in this async function inside myDB()
  passport.serializeUser((user, done) => {
    done(null, user._id);
  });
  passport.deserializeUser((id, done) => {
    myDataBase.findOne({ _id: new ObjectID(id) }, (error, doc) => {
      if (error) return console.error(error);
      done(null, doc);
    });
  });

  // LocalStrategy authentication
  passport.use(
    new LocalStrategy((username, password, done) => {
      myDataBase.findOne({ username: username }, (error, user) => {
        console.log("User " + username + " attempted to log in.");
        if (error) return done(error);
        if (!user) return done(null, false); // If there is no user in myDb
        if (!bcrypt.compareSync(password, user.password)) {
          // If passwrod is not correct (use bcrypt to keep information secure)
          return done(null, false);
        }
        return done(null, user); // If user exist and password is correct return the user object
      });
    })
  );
};
