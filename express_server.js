//--------------configuration--------------------
const express = require("express");
const bcrypt = require("bcrypt");
const app = express();
const PORT = process.env.PORT || 8080; // default port 8080
app.set("view engine", "ejs");
//--------------middleware--------------------
const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));
const cookieSession = require("cookie-session");
app.use(cookieSession({
	secret: "9uX2lkIjoiZGY4MDdmMDUwM2JhNTdhYTE0Y2FlM2YwNjNjOTY"
}));
const methodOverride = require("method-override");
app.use(methodOverride("_method"));

//------dummy database------------------------
const urlDatabase = {
    //-- object format: 
    //user_id: {
    //  shortUrl: {
    //    site: www.google.com,
    //    clicks: 0
    //  }
    //}
};
const users = {
    //-- object format: 
    //id: {
    //  name: otto,
    // 	email: @,
    // 	password: bcrypted, 
    // 	id: some random code
    // }
};


//---------------utility functions------------------
function generateRandomString() {
	const possibleChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
	let str = "";
	for(let i = 0; i < 6; i++){
		str += possibleChars[Math.floor(Math.random() * (possibleChars.length - 0))];
	}
	return str;
}

function ownsUrl(req){
	return urlDatabase[req.session.user_id] && urlDatabase[req.session.user_id].hasOwnProperty(req.params.id);
}

function urlExist(req){
  for(let user in urlDatabase){
    if(!user){
      return false;
    }
    if(urlDatabase[user].hasOwnProperty(req.params.id)){
      return true;
    }
  }
  return false;
}

function isLogedIn(req){
	if(req.session.user_id){
		return true;
	}else{
		return false;
	}
}

//--------------POST routes--------------------
app.post("/urls", (req, res) => {
  if(!isLogedIn(req)){
    res.status(403).end("You have been logged out due to session expire");
    return;
  }
	let shortCode = generateRandomString();
	if(!urlDatabase[req.session.user_id]){//if the user is adding an url for the first time
		urlDatabase[req.session.user_id] = {};
	}
	urlDatabase[req.session.user_id][shortCode] = {
		site: req.body.longURL,
		clicks: 0
	};
	res.redirect(`/urls/${shortCode}`);
});

app.post("/login",(req, res)=>{
	if(!req.body.email || !req.body.password){
		res.status(400).end("Please enter your credentials");
	}
	for(let user in users){
		if(req.body.email === users[user].email){
			if(bcrypt.compareSync(req.body.password, users[user].password)){
				req.session.user_id = user;
				res.redirect("/urls");
			} else {
				res.status(403).end("Wrong password bro");
			}
		}
	}
	res.status(403).end("You are not in the system. Booo");
});


app.post("/logout", (req, res)=>{
	req.session = null;
	res.redirect("/urls");
});

app.delete("/urls/:id", (req, res)=>{
	if(!isLogedIn(req) || !ownsUrl(req)){
		res.status(403).end("Sorry but this is not your link, you can't delete it");
		return;
	}
	delete urlDatabase[req.session.user_id][req.params.id];
	res.redirect("/urls");
});

app.put("/urls/:id", (req, res)=>{
	if(!isLogedIn(req)){
		res.status(403).end("You are logged out due to session expire");
		return;
	}
	urlDatabase[req.session.user_id][req.params.id].site = req.body.newURL;
	urlDatabase[req.session.user_id][req.params.id].clicks = 0;
	res.redirect("/urls");
});

app.post("/register", (req,res)=>{
	if(!req.body.email || !req.body.name || !req.body.password || users[req.body.name]){
		res.status(400).end("Information missing");
	}
	let randomCode = generateRandomString();
	users[randomCode] = {
		name: req.body.name,
		email: req.body.email,
		password: bcrypt.hashSync(req.body.password,10),
		id: randomCode
	};
	urlDatabase[randomCode] = {};
	req.session.user_id = randomCode;
	res.redirect("/urls");
});

//--------------GET routes--------------------

app.get("/login",(req, res)=>{
	if(isLogedIn(req)){
		res.redirect("/urls");
		return;
	}else{
		res.render("urls_login");
		return;
	}
});

app.get("/register",(req, res)=>{
	res.render("urls_reg");
});

app.get("/urls/new", (req, res) => {
	if(!users[req.session.user_id]){
		res.redirect("/login");
		return;
	}
	let templateVars = { user: users[req.session.user_id] };
	res.render("urls_new",templateVars);
});

app.get("/", (req, res) => {
	if(isLogedIn(req)){
		res.redirect("/urls");
		return;
	}
	else{
		res.redirect("/login");
	}
});

app.get("/urls.json", (req, res) => {
	res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
	res.end("<html><body>Hello <b>World</b></body></html>\n");
});

app.get("/urls/:id", (req, res) => {
	if(!isLogedIn(req)){
    res.status(404).end("Please log in");
    return;
  }
  if(!urlExist(req)){
    res.status(404).end("This url doesn't exist");
  }
  if(!ownsUrl(req)){
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
	let userUrls = {};
  if(isLogedIn(req)){
	  userUrls = urlDatabase[req.session.user_id];
  }
	let templateVars = {urls: userUrls,
		user: users[req.session.user_id]
	};

	res.render("urls_index", templateVars);
});

app.get("/u/:shortURL", (req, res) => {
	let longURL;

	for(let user in urlDatabase){
		for(let url in urlDatabase[user]){
			if(url === req.params.shortURL){//potential repeating link may cause problem
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


//----------------initialization--------------------
app.listen(PORT, () => {
	console.log(`Tiny app listening on port ${PORT}!`);
});