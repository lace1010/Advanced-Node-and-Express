const passport = require("passport");
const bcrypt = require("bcrypt");

module.exports = function (app, myDataBase) {
  // Handle homepage
  app.route("/").get((req, res) => {
    res.render("pug", {
      title: "Connected to Database",
      message: "Please login",
      showLogin: true, // If true then login form will show in index.pug
      showRegistration: true, // If true the  registration form will show in index.pug
    });
  });

  // Handle login page. If successful redirect to profile page if not redirect to homepage
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
    res.render(process.cwd() + "/views/pug/profile", {
      username: req.user.username,
    });
  });

  // Handle logout page by unauthenticating user and redirecting to homepage
  app.route("/logout").get((req, res) => {
    req.logout(); // In passport, unauthenticating a user is as easy as just calling req.logout();
    res.redirect("/");
  });

  // Handle when someone registers themselves as a new user
  app.route("/register").post(
    // first paramater is a function that finds if user exists and if not inserting new user to database
    (req, res, next) => {
      // use hash to store password to keep information secure with bcrypt
      const hash = bcrypt.hashSync(req.body.password, 12);
      myDataBase.findOne({ username: req.body.username }, (error, user) => {
        if (error) return next(error);
        // else I]if user already exists go back to home page
        else if (user) return res.redirect("/");
        // Else we insert a new user in the following logic
        else {
          myDataBase.insertOne(
            {
              username: req.body.username,
              password: hash,
            },
            (error, doc) => {
              if (error) return res.redirect("/");
              else next(null, doc.ops[0]);
            }
          );
        }
      });
    },
    // Second paramater authenticates the new user and redirects to profile page if passed and to homepage if failed
    passport.authenticate("local", { failureRedirect: "/" }),
    (req, res) => {
      res.redirect("/profile");
    }
  );

  // Handle missing pages (404)
  app.use((req, res, next) => {
    res.status(404).type("text").send("Not Found");
  });
};
// Add this middleware function that checks if a user is authenticated. (we need this to make sure not just anyone can type out "/login" at end of url and enter )
const ensureAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) return next(); // If true then go to next thing
  res.redirect("/"); // Else redirect to home page if user is not authenticated
};
