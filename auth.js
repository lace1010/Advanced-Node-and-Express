require("dotenv").config();
const passport = require("passport");
const bcrypt = require("bcrypt");
const LocalStrategy = require("passport-local");
const ObjectID = require("mongodb").ObjectID; // Need this to make a query serch for a Mongo _id
const GitHubStrategy = require("passport-github").Strategy;

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

  // GitHubStrategy authetication
  passport.use(
    new GitHubStrategy(
      {
        clientID: process.env.GITHUB_CLIENT_ID,
        clientSecret: process.env.GITHUB_CLIENT_SECRET,
        callbackURL:
          "https://advanced-node-express.herokuapp.com/auth/github/callback",
      },
      (accessToken, refreshToken, profile, cb) => {
        console.log(profile);
        console.log(profile.username);
        console.log(profile.displayName);
        console.log(profile.id);
        myDataBase.findOneAndUpdate(
          { id: profile.id },
          {
            $setOnInsert: {
              id: profile.id,
              photo: profile.photos[0].value || "",
              email: Array.isArray(profile.emails)
                ? profile.emails[0].value
                : "No public email",
              created_on: new Date(),
              provider: profile.provider || "",
              username: profile.displayName || profile.username,
            },
            $set: {
              last_login: new Date(),
            },
            $inc: {
              login_count: 1,
            },
          },
          { upsert: true, new: true },
          (err, doc) => {
            return cb(null, doc.value);
          }
        );
      }
    )
  );
};
