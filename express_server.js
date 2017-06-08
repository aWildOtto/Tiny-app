//--------------configuration--------------------
var express = require("express");
var app = express();
var PORT = process.env.PORT || 8080; // default port 8080
app.set("view engine", "ejs");

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};
const users = {
  somerandomcode:{
    name: 'Otto',
    email: 'otto@otto.otto',
    password: 'otto',
    id: 'somerandomcode'
  },
  jjj:{
    name: 'Joel',
    email: 'joel@joel.joel',
    password: 'joel',
    id: 'jjj'
  }
};

//--------------middleware--------------------
const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));
const cookieParser = require('cookie-parser')
app.use(cookieParser());


//--------------post routes--------------------
app.post("/urls", (req, res) => {
  //console.log(req.body.longURL);  // debug statement to see POST parameters
  let shortCode = generateRandomString();
  urlDatabase[shortCode] = req.body.longURL;
  res.redirect(`/urls/${shortCode}`);
});

app.post("/urls/:id/delete",(req, res)=>{
  delete urlDatabase[req.params.id];
  res.redirect(`/urls`);
});

app.post("/login",(req, res)=>{
  if(!req.body.email || !req.body.password){
    res.status(400).end("Please enter your credentials");
  }
  //console.log(users);
  //console.log(req.body.email+" and "+ req.body.password);
  for(let user in users){
  // console.log(users[user].email);
    if(req.body.email == users[user].email){
      if(req.body.password == users[user].password){
        res.cookie('user_id',user);
        res.redirect('/urls');
      } else {
        res.status(403).end("Wrong password bro");
      }
    }
  }
  res.status(403).end("You are not in the system. Booo");
});

app.post("/logout",(req, res)=>{
  res.clearCookie('user_id');
  res.redirect('/urls');
});

app.post("/urls/:id/update",(req,res)=>{
  //console.log(req.body.newURL);
  urlDatabase[req.params.id] = req.body.newURL;
  res.redirect(`/urls`);
});

app.post("/register",(req,res)=>{
  if(!req.body.email || !req.body.name || !req.body.password || users[req.body.name]){
    res.status(400).end("information missing");
  }
  let randomCode = generateRandomString();
  users[randomCode] = {
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    id: randomCode
  }
  res.cookie('user_id',randomCode);
  res.redirect('/urls');
});

//--------------get routes--------------------

app.get("/login",(req, res)=>{
  res.render('urls_login');
})

app.get("/register",(req,res)=>{
  res.render("urls_reg");
});

app.get("/urls/new", (req, res) => {
  let templateVars = { user: users[req.cookies['user_id']] };
  //console.log(users[req.cookies['user_id']]);
  res.render("urls_new",templateVars);
});

app.get("/", (req, res) => {
  res.redirect(`/urls`);
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
  res.end("<html><body>Hello <b>World</b></body></html>\n");
});

app.get("/urls/:id", (req, res) => {
  let templateVars = { shortURL: req.params.id,
                      longURL: urlDatabase[req.params.id],
                      user: users[req.cookies['user_id']], 
                    };
  res.render("urls_show", templateVars);
  
});

app.get("/urls", (req, res) => {
  let templateVars = {urls: urlDatabase,
                      user: users[req.cookies['user_id']]
                    };

  console.log(templateVars.user);
  res.render("urls_index",templateVars);
});

app.get("/u/:shortURL", (req, res) => {
  let longURL = urlDatabase[req.params.shortURL];
  //console.log(urlDatabase, longURL,req.params.shortURL);
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


//----------------initialization--------------------
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});