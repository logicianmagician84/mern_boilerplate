const express = require("express");
const path = require("path");
// const logger = require("morgan");
const jwt = require("./config/jwt");
const { User } = require("./models");
const {
  UNAUTHORIZED,
  BAD_REQUEST,
  NOT_FOUND,
  SERVER_ERROR,
  DUPLICATE_KEY_ERROR_CODE
} = require("./utils/http-status-codes");
const {
  DUPLICATE_EMAIL_ERROR,
  INVALID_PASSWORD_LENGTH
} = require('./utils/server-error-messages')

const app = express();
app.set("port", process.env.PORT || 3001);
// app.use(logger("dev"));
app.use(express.json());

const { initPassport, authenticate } = require("./config/passport");
initPassport(app, User);

app.post("/auth/login", (req, res) => {
  const { email, password } = req.body;
  User.findOne({ email })
    .then(user => {
      if (user) {
        return user.verifyPassword(password).then(isVerified => {
          if (isVerified) {
            const jwtPayload = { id: user.id };
            return res.json({ token: jwt.sign(jwtPayload) });
          }
          return Promise.reject();
        });
      }
      return Promise.reject();
    })
    .catch(error => {
      res.status(UNAUTHORIZED).send("Unauthorized");
    });
});

app.post("/api/users", (req, res) => {
  console.log('POST api/users')
  const { email, password } = req.body;
  User.create({ email, password })
    .then(user => {

      return res.end()

    })
    .catch(error => {
      const { name, code, path, message } = error;
      console.log(message)
      // if (name === "MongoError" && code === DUPLICATE_KEY_ERROR_CODE) {
      //   res
      //     .status(BAD_REQUEST)
      //     .send(message);
      // }
      // if (name === "ValidationError") {
      //   console.log('ValidationError') 

      //   res.status(BAD_REQUEST).send("Invalid email or password format.");
      // }
      if (message === INVALID_PASSWORD_LENGTH) {
        console.log()
        res.status(400)
          .send(error);
      }
      // res.status(SERVER_ERROR).end();
    });
});

app.get("/api/users/:id", authenticate(), (req, res) => {
  // prevent logged in user from accessing other user accounts
  if (req.user.id !== req.params.id) {
    return res.status(UNAUTHORIZED).send("Unauthorized");
  }
  return User.findById(req.params.id).then(user => {
    if (user) {
      return res.json({ user });
    }
    return res.status(NOT_FOUND).send("User not found");
  });
});

// Serve static assets in production only
if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "../client/build")));
}

module.exports = { app };
