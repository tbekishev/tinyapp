const express = require("express");
const app = express();
const cookieSession = require('cookie-session');
const bcrypt = require("bcryptjs");
const PORT = 8080; // default port 8080
const { getUserByEmail } = require("./helpers.js");
/*const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};*/

const urlDatabase = {
  b6UTxQ: {
    longURL: "https://www.tsn.ca",
    userID: "aJ48lW",
  },
  i3BoGr: {
    longURL: "https://www.google.ca",
    userID: "aJ48lW",
  },
  sm5xK: {
    longURL: "http://www.lighthouselabs.ca",
    userID: "userRandomID",
  },
};

const users = {
  aJ48lW : {
    id: "aJ48lW",
    email: "tbekishev@gmail.com",
    password: "$2a$10$yBYasmiBQlhhBGvvV0.jUu/AS570whMtNA1d5ex2u6v82htIGiqGa",
  },
};

//const users = { };
//const cookie = req.headers.cookie;

function generateRandomString() {
  const chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let str = '';
  for (let i = 0; i < 6; i++) {
    str += chars[Math.floor(Math.random() * chars.length)];
  }
  return str;
}

function urlsForUser(id, database) {
  const newObj = {};
  for (let key in database) {
    if (database[key].userID === id) {
      newObj[key] = database[key];
    }
  }
  return newObj;
}

app.use(cookieSession({
  name: 'session',
  keys: ['key1', 'key2']
}))
app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));


app.get("/", (req, res) => {
  res.redirect('/urls');
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/urls", (req, res) => {
  const templateVars = { user: users[req.session.user_id], cookie: req.session.user_id, urls: urlsForUser(req.session.user_id, urlDatabase)};
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  if (!req.session.user_id) {
    res.redirect("/login");
  } else {
    const templateVars = { cookie: req.session.user_id, user: users[req.session.user_id] };
    res.render("urls_new", templateVars);
  }
});

app.get("/urls/:id", (req, res) => {
  if (!req.session.user_id) {
    res.send("<html><body>Only registered users can use this URL! Please login or register.</body></html>\n");
  } else {
    if (urlsForUser(req.session.user_id, urlDatabase)[req.params.id]) {
      const templateVars = { cookie: req.session.user_id, user: users[req.session.user_id], id: req.params.id, longURL: urlsForUser(req.session.user_id, urlDatabase)[req.params.id].longURL };
      res.render("urls_show", templateVars);
    } else {
      res.send("<html><body>This URL does not exist!</body></html>\n");

    }
  }
});

app.post("/urls", (req, res) => {
  if (!req.session.user_id) {
    res.send("<html><body>Only registered users can create new URL! Please login or register.</body></html>\n");
  } else {
    const newShort = generateRandomString();
    urlDatabase[newShort] = {};
    urlDatabase[newShort].longURL = req.body.longURL;
    urlDatabase[newShort].userID = req.session.user_id;
    res.redirect(`/urls/${newShort}`);
  }
});

app.get("/u/:id", (req, res) => {
  if (!req.session.user_id) {
    res.send("<html><body>Only registered users can use this URL! Please login or register.</body></html>\n");
  } else {
    const templateVars = { cookie: req.session.user_id, id: req.params.id, longURL: urlDatabase[req.params.id].longURL };
    const longURL = templateVars.longURL;
    if (templateVars.id === 'undefined') {
      res.send("<html><body>This url does not exist</body></html>\n");
    } else
      res.redirect(longURL);
  }
});

app.post("/urls/:id/delete", (req, res) => {
  if (!req.session.user_id) {
    res.send("<html><body>Only registered users can create new URL! Please login or register.</body></html>\n");
  } else {
    if (urlsForUser(req.session.user_id, urlDatabase)[req.params.id]) {
      const id = req.params.id;
      delete urlDatabase[id];
      res.redirect('/urls');
    } else {
      res.send("<html><body>Cannot delete. This URL does not exist.</body></html>\n");
    }
  }
});

app.post("/urls/:id", (req, res) => {
  if (!req.session.user_id) {
    res.send("<html><body>Only registered users can edit URL! Please login or register.</body></html>\n");
  } else {
    urlDatabase[req.params.id].longURL = req.body.longURL;
    const templateVars = { cookie: req.session.user_id, user: users[req.session.user_id], id: req.params.id, longURL: urlDatabase[req.params.id].longURL };
    res.render("urls_show", templateVars);
  }
});

app.post("/login", (req, res) => {
  const user = getUserByEmail(req.body.email, users);
  if (user &&  bcrypt.compareSync(req.body.password, user.password)) {
    req.session.user_id = user.id;
    res.redirect("/urls");
  } else {
    res.status(403).send('Login is incorrect or email is not registered');
  }
});

app.post("/logout", (req, res) => {
  req.session = null
  res.redirect("/login");
});

app.get("/register", (req, res) => {
  if (req.session.user_id) {
    res.redirect("/urls");
  } else {
    const templateVars = { cookie: req.session.user_id, user: users[req.session.user_id] };
    res.render("urls_register", templateVars);
  }
});

app.post("/register", (req, res) => {
  if (req.body.email === '' || req.body.password === '') {
    res.status(400).send('email or password is empty');
  }
  if (getUserByEmail(req.body.email, users) !== null) {
    res.status(400).send('this email is already registered');
  }
  const newUserId = generateRandomString();
  const hashedPassword = bcrypt.hashSync(req.body.password, 10);
  const tempUser = { id: newUserId, email: req.body.email, password: hashedPassword }
  users[newUserId] = tempUser;
  req.session.user_id = newUserId;
  res.redirect("/urls");
});

app.get("/login", (req, res) => {
  if (req.session.user_id) {
    res.redirect("/urls");
  } else {
    const templateVars = { cookie: req.session.user_id, user: users[req.session.user_id] };
    res.render("urls_login", templateVars);
  }
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});