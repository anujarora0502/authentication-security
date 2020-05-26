const express = require("express");
const ejs = require("ejs");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const app = express();
const encrypt = require("mongoose-encryption");
const session = require('express-session');
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose"); // no need to declare passport-local
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
  password: String
});


userSchema.plugin(passportLocalMongoose);


const User  = new mongoose.model("User",userSchema);

passport.use(User.createStrategy());

passport.serializeUser(User.serializeUser());   /// start cookie session
passport.deserializeUser(User.deserializeUser());

app.get("/",(req,res)=>{

  res.render("home");

});
app.get("/login",(req,res)=>{

  res.render("login");

});
app.get("/register",(req,res)=>{

  res.render("register");

});
app.get("/secrets",(req,res)=>{
  if(req.isAuthenticated()){
    res.render("secrets");
  }else{
    res.render("login");
  }
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




app.listen(3000,()=>{
  console.log("Server running at port 3000");
})
