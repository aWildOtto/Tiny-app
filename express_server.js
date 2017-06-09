//--------------configuration--------------------
var express = require("express");
const bcrypt = require('bcrypt');
var app = express();
var PORT = process.env.PORT || 8080; // default port 8080
app.set("view engine", "ejs");
//------dummy database with test data------------
const urlDatabase = {
  somerandomcode: {
    "b2xVn2": {
      site: "http://www.lighthouselabs.ca",
      clicks: 0
    },
    "9sm5xK": {
      site: "http://www.google.com",
      clicks: 0
    }
  },
  jjj: {
    "a1234z": {
      site: "http://www.pinterest.com",
      clicks: 0
    }
  }
};
const users = {
  somerandomcode:{
    name: 'Otto',
    email: 'otto@otto.otto',
    password: bcrypt.hashSync('otto',10),
    id: 'somerandomcode'
  },
  jjj:{
    name: 'Joel',
    email: 'joel@joel.joel',
    password: bcrypt.hashSync('joel',10),
    id: 'jjj'
  }
};

//--------------middleware--------------------
const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));
const cookieSession = require('cookie-session');
app.use(cookieSession({
  secret: '9uX2lkIjoiZGY4MDdmMDUwM2JhNTdhYTE0Y2FlM2YwNjNjOTY'
}));


//--------------POST routes--------------------
app.post("/urls", (req, res) => {
  //console.log(req.body.longURL);  // debug statement to see POST parameters
  let shortCode = generateRandomString();
  if(!urlDatabase[req.session.user_id]){
    urlDatabase[req.session.user_id] = {};
  }
  urlDatabase[req.session.user_id][shortCode] = {
    site: req.body.longURL,
    clicks: 0
  };
  res.redirect(`/urls/${shortCode}`);
});

app.post("/urls/:id/delete",(req, res)=>{
  if(!req.session.user_id || !urlDatabase[req.session.user_id] || !urlDatabase[req.session.user_id].hasOwnProperty(req.params.id)){
    res.status(403).end("Sory but this is not your link, you can't delete it");
    return;
  }
  delete urlDatabase[req.session.user_id][req.params.id];
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
    if(req.body.email === users[user].email){
      if(bcrypt.compareSync(req.body.password, users[user].password)){
        req.session.user_id = user;
        res.redirect('/urls');
      } else {
        res.status(403).end("Wrong password bro");
      }
    }
  }
  res.status(403).end("You are not in the system. Booo");
});

app.post("/logout",(req, res)=>{
  req.session = null;
  res.redirect('/urls');
});

app.post("/urls/:id/update",(req,res)=>{
  //console.log(req.body.newURL);
  urlDatabase[req.session.user_id][req.params.id].site = req.body.newURL;
  urlDatabase[req.session.user_id][req.params.id].clicks = 0;
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
    password: bcrypt.hashSync(req.body.password,10),
    id: randomCode
  }
  urlDatabase[randomCode] = {};
  req.session.user_id = randomCode;
  res.redirect('/urls');
});

//--------------GET routes--------------------

app.get("/login",(req, res)=>{
  if(req.session.user_id){
    res.redirect('urls');
    return;
  }else{
    res.render('urls_login');
    return;
  }
})

app.get("/register",(req,res)=>{
  res.render("urls_reg");
});

app.get("/urls/new", (req, res) => {
  if(!users[req.session.user_id]){
    res.redirect('/login');
    return;
  }
  let templateVars = { user: users[req.session.user_id] };
  //console.log(users[req.session.user_id]);
  res.render("urls_new",templateVars);
});

app.get("/", (req, res) => {
  if(req.session.user_id){
    res.redirect(`/urls`);
    return;
  }
  else{
    res.redirect(`/login`);
  }
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
  res.end("<html><body>Hello <b>World</b></body></html>\n");
});

app.get("/urls/:id", (req, res) => {
  // console.log(urlDatabase[req.session.user_id][req.params.id]);
  if(!urlDatabase[req.session.user_id] || !urlDatabase[req.session.user_id].hasOwnProperty(req.params.id)){
    res.status(404).end("Sorry, you can't edit this link cuz this link doesn't belong to ya");
    return;
  }
  let templateVars = { shortURL: req.params.id,
                      longURL: urlDatabase[req.session.user_id][req.params.id],
                      user: users[req.session.user_id], 
                    };
  res.render("urls_show", templateVars);
  
});

app.get("/urls", (req, res) => {
  let allUrls = {};
   for(let user in urlDatabase){
    for(let url in urlDatabase[user]){
      allUrls[url] = urlDatabase[user][url];
    }
  }
  let templateVars = {urls: allUrls,
                      user: users[req.session.user_id]
                    };

  //console.log(templateVars.user);
  res.render("urls_index",templateVars);
});

app.get("/u/:shortURL", (req, res) => {
  let longURL;

  for(let user in urlDatabase){
    for(let url in urlDatabase[user]){
      if(url===req.params.shortURL){//potential repeating link may cause problem
        longURL = urlDatabase[user][url];
      }
    }
  }
  if(longURL){
    longURL.clicks += 1;//(stretch) recording how many times a link is clicked
    res.redirect(longURL.site);
  }else{
    res.status(404).end("link not found");
  }
});


//---------------utility functions------------------
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