var express = require("express");
var app = express();
var PORT = process.env.PORT || 8080; // default port 8080

app.set("view engine", "ejs");

var urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));


app.get("/urls/new", (req, res) => {
  res.render("urls_new");
});

app.post("/urls", (req, res) => {
  console.log(req.body.longURL);  // debug statement to see POST parameters
  let shortCode = generateRandomString();
  urlDatabase[shortCode] = req.body.longURL;
  console.log(`urlDatabase:`);
  console.log(JSON.stringify(urlDatabase, null, 2));
  res.send(`<html><a href=http://localhost:8080/u/${shortCode}>here's your link:</a>http://localhost:8080/u/${shortCode}</html>`);
});


app.get("/", (req, res) => {
  res.end("Hello!");
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
  res.end("<html><body>Hello <b>World</b></body></html>\n");
});

app.get("/urls/:id", (req, res) => {
  let templateVars = { shortURL: req.params.id,
                      longURL: urlDatabase[req.params.id] };
  res.render("urls_show", templateVars);
});

app.get("/urls", (req, res) => {
  let templateVars = {urls: urlDatabase};
  res.render("urls_index",templateVars);
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

app.get("/u/:shortURL", (req, res) => {
  let longURL = urlDatabase[req.params.shortURL];
  res.redirect(longURL);
});

function generateRandomString() {
  const possibleChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  var str = "";
  for(let i = 0; i < 6; i++){
    str += possibleChars[Math.floor(Math.random() * (possibleChars.length - 0))];
  }
  return str;
}