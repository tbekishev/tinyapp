const express = require("express");
const app = express();
const cookieParser = require('cookie-parser')
const PORT = 8080; // default port 8080
const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

const users = {
  userRandomID: {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur",
  },
  user2RandomID: {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk",
  },
};

//const cookie = req.headers.cookie;

function generateRandomString() {
  const chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let str = '';
  for (let i = 0; i < 6; i++) {
    str += chars[Math.floor(Math.random() * chars.length)];
  }
  return str;
}

function getUserByEmail(email1) {
  for (let key in users) {
    if (users[key].email === email1) {
      return users[key];
    } 
  }
  return null;
}

app.use(cookieParser());
app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  res.redirect('/urls');
}); 

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.get("/urls", (req, res) => {
  const templateVars = { user: users[req.cookies.user_id], cookie: req.cookies.user_id, urls: urlDatabase };
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => { 
  if (!req.cookies.user_id) {
    res.redirect("/login");
  } else {
    const templateVars = { cookie: req.cookies.user_id, user: users[req.cookies.user_id] };
    res.render("urls_new", templateVars);
  }
});

app.get("/urls/:id", (req, res) => {
  const templateVars = { cookie: req.cookies.user_id, user: users[req.cookies.user_id], id: req.params.id, longURL: urlDatabase[req.params.id] };
  res.render("urls_show", templateVars);
});

app.post("/urls", (req, res) => {
  if (!req.cookies.user_id) {
    res.send("<html><body>Only registered users can create new URL! Please login or register.</body></html>\n");
  } else {
    const newShort = generateRandomString();
    urlDatabase[newShort] = req.body.longURL;
    res.redirect(`/urls/${newShort}`);
  }
});

app.get("/u/:id", (req, res) => {
  const templateVars = { cookie: req.cookies.user_id, id: req.params.id, longURL: urlDatabase[req.params.id] };
  const longURL = templateVars.longURL;
  console.log(templateVars)
  if (templateVars.id === 'undefined') {
    res.send("<html><body>This url does not exist</body></html>\n");
  } else
  res.redirect(longURL);
});

app.post("/urls/:id/delete", (req, res) => {
  const id = req.params.id;
  delete urlDatabase[id];
  res.redirect('/urls');
});

app.post("/urls/:id", (req, res) => {
  urlDatabase[req.params.id] = req.body.longURL;
  const templateVars = { cookie: req.cookies.user_id, user: users[req.cookies.user_id], id: req.params.id, longURL: urlDatabase[req.params.id] };
  res.render("urls_show", templateVars);
});

app.post("/login", (req, res) => {
  const user = getUserByEmail(req.body.email);
  if (user !== null && user.password === req.body.password) {
    res.cookie('user_id', user.id);
    res.redirect("/urls");
  } else {
    res.status(403).send('Login is incorrect or no such an email registered')
  }
})

app.post("/logout", (req, res) => {
  const templateVars = {cookie: req.cookies.user_id, user: users[req.cookies.user_id]  };
  res.clearCookie('user_id');
  res.render("urls_login", templateVars);
})

app.get("/register", (req, res) => {
  if (req.cookies.user_id) {
    res.redirect("/urls");
  } else {
    const templateVars = { cookie: req.cookies.user_id, user: users[req.cookies.user_id] };
    res.render("urls_register", templateVars);
  }
});

app.post("/register", (req, res) => {
  if (req.body.email === '' || req.body.password === '') {
    res.status(400).send('email or password is empty')
  }
  if (getUserByEmail(req.body.email) !== null) {
      res.status(400).send('this email is already registered');
    }
  const newUserId = generateRandomString();
  users[newUserId] = {};
  users[newUserId].id = newUserId;
  users[newUserId].email = req.body.email;
  users[newUserId].password = req.body.password;
  res.cookie('user_id', newUserId);
  res.redirect("/urls");
})

app.get("/login", (req, res) => {
  if (req.cookies.user_id) {
    res.redirect("/urls");
  } else {
    const templateVars = { cookie: req.cookies.user_id, user: users[req.cookies.user_id] };
    res.render("urls_login", templateVars);
  }
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});