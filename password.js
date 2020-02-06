// Define variables
const express = require("express");
const fs = require("fs");
const session = require("express-session");
//const passwordList = require('./password.json');

var passwordList = [];

const app = express();
app.use(express.json());
// Set the user session
app.use(
  session({
    secret: "dog food",
    resave: false,
    saveUninitialized: true
  })
);

// Set the port to the environment port or default is 3000
const port = process.env.PORT || 5000;

// Define arrays for the Guitar Stock and User Cart
//let passwordList = new Array();
let passwordTemp = new Array();

// Used to handle CORS issues
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  // authorized headers for preflight requests
  // https://developer.mozilla.org/en-US/docs/Glossary/preflight_request
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  next();
  app.options("*", (req, res) => {
    // allowed XHR methods
    res.header(
      "Access-Control-Allow-Methods",
      "GET, PATCH, PUT, POST, DELETE, OPTIONS"
    );
    res.send();
  });
});

// GET - Sends the passwordList array as a response
app.get("/keeper/passwords", (req, res) => {
  if (req.session.keeper) {
    passwordTemp = req.session.keeper;
  }
  else
    passwordTemp = passwordList;
  res.json(passwordTemp);
});

// GET - Checks if the password is in a list, sends it if it is or an error message if it's not
app.get("/keeper/passwords/:id", (req, res) => {
  const listIndex = passwordIndex(req.params.id);
  if (listIndex < 0 || listIndex >= passwordList.length) {
    res.json("<h4>No password stored</h4>");
  } else {
    let result =
      "</li><li> Id: " +
      passwordList[listIndex].id +
      "</li><li> Service: " +
      passwordList[listIndex].service +
      "</li><li> Email: " +
      passwordList[listIndex].email +
      "</li><li> Password: " +
      passwordList[listIndex].password +
      "</li><li> Key: " +
      passwordList[listIndex].key +
      "</li>";

    res.json(result);
  }
});

// POST - Add a new password
app.post("/keeper/passwords", (req, res) => {
  const { key } = req.body;
  if (passwordList.some(password => password.key === key)) {
    res.status(400).send({ error: "Password already exist!" });
  } else {
    const newPassword = { id: passwordList.length + 1, ...req.body };
    const newPasswordList = passwordList.concat(newPassword);
    fs.writeFile(
      "password.json",
      JSON.stringify(newPasswordList, null, 2),
      err => {
        if (err)
          return res.status(500).send({ error: "Unable to write to file" });
        res.send(newPassword);
      }
    );
  }
});

// DELETE - Deletes from the list if the password is in the list, otherwise sends an error message
app.delete("/keeper/passwords/:id", (req, res) => {
  let isInList = false;
  let index = 0;

  if (req.session.keeper) {
    passwordTemp = req.session.keeper;
  } else passwordTemp = passwordList;

  for (let i = 0; i < passwordTemp.length; i++) {
    if (passwordTemp[i].id === parseInt(req.params.id)) {
      isInList = true;
      index = passwordTemp[i].id;
      break;
    }
  }

  if (isInList) {
    passwordTemp = passwordTemp.filter(item => item.id != index);

    req.session.keeper = passwordTemp;

    fs.writeFile(
      "password.json",
      JSON.stringify(passwordTemp, null, 2),
      err => {
        if (err) {
          return res.json(err);
        }
        return res.json("This password has been deleted.");
      }
    );
  } else {
    res.json("This password can't be deleted because it is not in the list.");
  }
});

app.delete("/keeper/passwords_all", (req, res) => {
  if (req.session.keeper) {
    passwordTemp = req.session.keeper;
  }

  passwordTemp = [];

  req.session.keeper = passwordTemp;

  fs.writeFile("password.json", JSON.stringify(passwordTemp, null, 2), err => {
    if (!err) {
      return res.json("All password has been deleted.");
    }
    return res.json("Error");
  });
});

const passwordIndex = function(id) {
  let index = -1;
  let parsedId = parseInt(id);
  if (isNaN(parsedId)) {
    return index;
  } else {
    for (let i = 0; i < passwordList.length; i++) {
      if (parseInt(passwordList[i].id) === parsedId) {
        index = i;
      }
    }
    return index;
  }
};

// POST - Displays password to perform operation
app.post("/keeper/passwords", (req, res) => {
  if (req.session.keeper) {
    passwordTemp = req.session.keeper;
  }
  req.session.keeper = passwordTemp;
  res.json(passwordTemp);
});

// Set the server to listen
app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
  readJsonFile();
});

function readJsonFile() {
  fs.readFile("password.json", "utf8", function readFileCallback(err, data) {
    if (err) {
      console.log(err);
    } else {
      obj = JSON.parse(data);
      passwordList = obj;
    }
  });
}
