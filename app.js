require('dotenv').config()
const express = require("express");
const ejs = require("ejs");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const app = express();
const encrypt = require("mongoose-encryption");
const session = require('express-session');
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose"); // no need to declare passport-local
var GoogleStrategy = require('passport-google-oauth20').Strategy;
var FacebookStrategy = require('passport-facebook').Strategy;
var findOrCreate = require("mongoose-findorcreate");
app.use(express.static("public"));
app.set('view engine','ejs');

app.use(bodyParser.urlencoded({

   extended: true
}));

app.use(session({
  secret: "Our little Secret.",
  resave: false,
  saveUninitialized:false

}));

app.use(passport.initialize());
app.use(passport.session());





mongoose.connect("mongodb://localhost:27017/userDB",{useNewUrlParser: true,useUnifiedTopology:true,useCreateIndex:true});

const userSchema =new mongoose.Schema({
  email: String,
  password: String,
  googleId: String,
  facebookId: String,
  secret: String
});


userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);


const User  = new mongoose.model("User",userSchema);

passport.use(User.createStrategy());

passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.findById(id, function(err, user) {
    done(err, user);
  });
});

passport.use(new FacebookStrategy({
    clientID: process.env.FACEBOOK_APP_ID,
    clientSecret: process.env.FACEBOOK_APP_SECRET,
    callbackURL: "http://localhost:3000/auth/facebook/secrets"
  },
  function(accessToken, refreshToken, profile, cb) {
    User.findOrCreate({ facebookId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));

passport.use(new GoogleStrategy({
    clientID : process.env.GOOGLE_CLIENT_ID,
    clientSecret : process.env.GOOGLE_CLIENT_SECRET,
    callbackURL : "http://localhost:3000/auth/google/secrets",
    userProfileURL : "https://www.googleapis.com/oauth2/v3/userinfo"
  },
  (accessToken, refreshToken, profile, cb)=> {
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));

app.get("/",(req,res)=>{

  res.render("home");

});
app.get('/auth/facebook',
  passport.authenticate('facebook'));

app.get('/auth/facebook/secrets',
  passport.authenticate('facebook', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect('/secrets');
  });
app.get("/auth/google",
  passport.authenticate('google',{scope:["profile"] })
);

app.get("/auth/google/secrets",
  passport.authenticate('google', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect('/secrets');
  });
app.get("/login",(req,res)=>{

  res.render("login");

});
app.get("/register",(req,res)=>{

  res.render("register");

});
app.get("/secrets",(req,res)=>{
  User.find({"secret":{$ne:null}},(err,foundUsers)=>{
    if(err){
      console.log(err);
    }else{
      if(foundUsers){
        res.render("secrets",{
          usersWithSecrets:foundUsers
        })
      }
    }
  })
})

app.get("/logout",(req,res)=>{
  req.logout();
  res.redirect("/");
});

app.post("/login",(req,res)=>{

  const user = new User({
    username : req.body.username,
    passowrd: req.body.password
  });
    req.login(user, (err)=>{
      if(err){
        console.log(err);
      }else{
        passport.authenticate("local")(req,res,()=>{
          res.redirect("/secrets");
        })
      }
    })
});
app.post("/register",(req,res)=>{

    User.register({username: req.body.username},req.body.password,(err,user)=>{
        if(err){
          console.log(err);
          res.redirect("/register");
        } else{
          passport.authenticate("local")(req,res,()=>{
            res.redirect("/secrets");
          })
        }
    })

});


app.get("/submit",(req,res)=>{
  if(req.isAuthenticated()){
    res.render("submit");
  }else{
    res.redirect("/login");
  }
})

app.post("/submit",(req,res)=>{
  const usersecret = req.body.secret;
  User.findById(req.user.id, (err,fUser)=>{
    if(err){
      console.log(err);
    }else if (fUser){
      fUser.secret = usersecret;
      fUser.save(()=>{
        res.redirect("/secrets");
      });
    }
  })
})

app.listen(3000,()=>{
  console.log("Server running at port 3000");
})
