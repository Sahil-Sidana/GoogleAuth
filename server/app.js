require("dotenv").config();
const express = require("express");
const app = express();
const cors = require("cors");
require("./db/conn")
const PORT = 6005;
const session = require("express-session");
const passport = require("passport");
const OAuth2Strategy = require("passport-google-oauth2").Strategy;
const userdb = require("./model/userSchema")

const clientid = process.env.id
const clientsecret = process.env.secret

app.use(cors({
    origin:["http://localhost:3000", "https://google-auth-5jd3d8l9y-sahil-sidanas-projects.vercel.app/"],
    methods:"GET,POST,PUT,DELETE",
    credentials:true
}));

app.use(express.json());

app.use(session({
    secret:process.env.key,
    resave:false,
    saveUninitialized:true
}));

app.use(passport.initialize());
app.use(passport.session());

passport.use(
    new OAuth2Strategy({
        clientID:clientid,
        clientSecret:clientsecret,
        callbackURL:"/auth/google/callback",
        scope:["profile","email"]
    },
    async(accessToken,refreshToken,profile,done)=>{
        console.log(profile);
        try {

            let user = await userdb.findOne({googleId:profile.id});

            if(!user){
                user = new userdb({
                    googleId:profile.id,
                    displayName:profile.displayName,
                    email:profile.emails[0].value,
                    image:profile.photos[0].value
                });

                await user.save();
            }
            return done(null,user);
        } 
        catch (error) {
            return done(error,null);
        }
    }
    )
);

passport.serializeUser((user,done)=>{
    done(null,user);
})

passport.deserializeUser((user,done)=>{
    done(null,user);
});

// initial google ouath login
app.get("/auth/google",passport.authenticate("google",{scope:["profile","email"]}));

app.get("/auth/google/callback",passport.authenticate("google",{
    successRedirect:"https://google-auth-5jd3d8l9y-sahil-sidanas-projects.vercel.app//dashboard",
    failureRedirect:"https://google-auth-5jd3d8l9y-sahil-sidanas-projects.vercel.app//login"
}));

app.get("/login/sucess",async(req,res)=>{

    if(req.user){
        res.status(200).json({message:"user Login",user:req.user})
    }else{
        res.status(400).json({message:"Not Authorized"})
    }
})

app.get("/logout",(req,res,next)=>{
    req.logout(function(err){
        if(err){return next(err)}
        res.redirect("https://google-auth-5jd3d8l9y-sahil-sidanas-projects.vercel.app/");
    })
});

app.listen(PORT,()=>{
    console.log(`server start at port no ${PORT}`)
});