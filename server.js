if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}
const users = [];

const express = require("express");
const bcrypt = require("bcrypt");
const flash = require("express-flash");
const session = require("express-session");
const initializePassport = require("./passport-config");
const passport = require("passport");
const methodOverride = require("method-override");
const morgan = require("morgan");

initializePassport(
  passport,
  (email) => users.find((user) => user.email === email),
  (id) => users.find((user) => user.id === id)
);

const app = express();
app.use(methodOverride("_method"));
app.use(flash());
app.set("view-engine", "ejs");
app.use(express.urlencoded({ extended: false }));
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
  })
);

app.use(passport.initialize());
app.use(passport.session());

app.get("/", checkAuthenticated, (req, res) => {
  res.render("index.ejs", { name: req.user.name });
});
app.get("/login", checkNotAuthenticated, (req, res) => {
  res.render("login.ejs");
});

app.post(
  "/login",
  passport.authenticate("local", {
    successRedirect: "/",
    failureRedirect: "/login",
    failureFlash: true,
  })
);

app.get("/register", checkNotAuthenticated, (req, res) => {
  res.render("register.ejs");
});

app.post("/register", async (req, res) => {
  try {
    const hashedPassword = await bcrypt.hash(req.body.password, 10);
    users.push({
      id: Date.now().toString(),
      name: req.body.name,
      email: req.body.email,
      password: hashedPassword,
    });
    res.redirect("/login");
  } catch {
    res.redirect("/register");
  }
  console.log(users);
});

app.delete("/logout", (req, res) => {
  req.logout((err) => {
    if (err) {
      // Handle error, if any
      console.error(err);
      res.status(500).send("Error logging out");
      return;
    }
    res.redirect("/login"); // Redirect after successful logout
  });
});

function checkAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }

  res.redirect("/login");
}

function checkNotAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return res.redirect("/");
  }
  next();
}

app.listen(5000, () => {
  console.log("server is runnning on port 5000");
});
