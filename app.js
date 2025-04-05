const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const db = require('./db');
const cors = require('cors');
const express = require('express');
const app = express();
const path = require('path');
const session = require('express-session');
const bodyParser = require('body-parser');
require('dotenv').config();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(express.static('html_files'));
app.use('/css_files', express.static(path.join(__dirname, 'resources/css_files')));
app.use('/image', express.static(path.join(__dirname, 'resources/image')));
app.use('/uploads', express.static('uploads')); 

app.use(express.json());
app.use(express.urlencoded({ extended: true }));


app.use(session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized:false,
    cookie: { secure: false, httpOnly: true } 
}));

app.use(passport.initialize());
app.use(passport.session());

app.use(cors({
    origin: "http://localhost:3000", 
    credentials: true  
}));


const signupRoutes = require('./routes/signup.routes.js');
const loginRoutes = require('./routes/login.routes.js');
const logoutRoutes = require('./routes/logout.routes.js');
const dashboardRoutes = require('./routes/dashboard.routes.js');
const shopRoutes = require('./routes/shop.routes.js');
const cartRoutes= require('./routes/cart.routes.js');


passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
   callbackURL: "https://thrifttykesapp-hshmc6f9dzcfawg6.eastus-01.azurewebsites.net/auth/google/callback"

}, async (accessToken, refreshToken, profile, done) => {
    try {
        let user = await db.user.findUnique({
            where: { email: profile.emails[0].value }
        });

        if (!user) {
            user = await db.user.create({
                data: {
                    name: profile.displayName,
                    email: profile.emails[0].value,
                    password: null,
                }
            });
        }

        console.log("Authenticated User:", user); 
        return done(null, user);  
    } catch (err) {
        return done(err, null);
    }
}));




passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
    try {
        const user = await db.user.findUnique({ where: {id } });
        done(null, user);
    } catch (err) {
        done(err, null);
    }
});

app.get('/auth/google',
    passport.authenticate('google', { scope: ['profile', 'email'] })
);

app.get('/auth/google/callback',
    passport.authenticate('google', { failureRedirect: '/login' }),
    (req, res) => {
        req.session.userId = req.user.email;
        res.redirect('/dashboard'); 
    }
);




app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, './resources/html_files', 'landing.html'));
});


// app.get("/api/exercise/:id", async (req, res) => {
//     const { id } = req.params;

//     try {
//       const exercise = await prisma.exercise.findUnique({
//         where: { id },
//       });

//       if (exercise) {
//         res.json(exercise);
//       } else {
//         res.status(404).json({ message: "Exercise not found" });
//       }
//     } catch (error) {
//       res.status(500).json({ error: "Server error" });
//     }
//   });

function ensureAuthenticated(req, res, next) {
    const publicPaths = ['/', '/login', '/signup', '/auth/google', '/auth/google/callback'];

    if (publicPaths.includes(req.path)) {
        return next();  
    }

    if (req.session.userId) {
        return next();  
    }

    console.log("Redirecting to /login because user is not authenticated");
    res.redirect('/login');  
}


app.use(ensureAuthenticated);



app.use(signupRoutes);
app.use(loginRoutes);
app.use(logoutRoutes);
app.use(dashboardRoutes);
app.use(shopRoutes);
app.use(cartRoutes);

const port = process.env.port||8080;
app.listen(port, () => {
    console.log(`App is listening to port ${port}`);
});

