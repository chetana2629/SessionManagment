const express = require('express');
const bcrypt = require('bcryptjs');
const session = require('express-session');
const MongoDBSession = require('connect-mongodb-session')(session);
const mongoose = require('mongoose');
const app = express();

const UserModel = require('./models/User');
const mongoURI = "mongodb://localhost:27017/sessions"

mongoose.connect(mongoURI,{
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then((res) => {
console.log("MongoDb Connected!");

});

const store =new MongoDBSession ({
    uri : mongoURI,
    collection: "mySession",

})

app.set("view engine","ejs");
app.use(express.urlencoded({ extended:true }));

// Middleware for sessions
app.use(session({
    secret: 'key that will sing cookie',
    resave: false,
    saveUninitialized: true,
    store: store,
}));

const isAuth = (req, res, next) => {
if(req.session.isAuth){
    next();
    
}
else {
    res.redirect('/login');
    
}
}
 
app.get('/', (req, res) => {
   res.render("landing");
});

app.get('/login', (req, res) => {
    res.render("login");
});

app.post('/login',  async (req, res) => {
    const { email , password} = req.body;

    const user = await UserModel.findOne({ email });
    if (!user) {
    return res.redirect('/login');
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
    return res.redirect('/login');
    }
     req.session.isAuth = true;
     req.session.username = user.username; // Store the username in the session

    res.redirect('/dashboard');

});

app.get("/register",    (req, res) => {
  res.render("register");
});

app.post('/register', async (req, res) => {
    const { username,email,password} = req.body;

    let user = await UserModel.findOne({ email});

    if(user) {
        return res.redirect("/register");
    }

    const hashPsw = await bcrypt.hash(password, 12);
    user = new UserModel({
        username,
         email,
         password: hashPsw
    })

    await user.save();
    res.redirect("/login");
});

 


app.get('/dashboard', isAuth, (req, res) => {
    res.render("dashboard", { username: req.session.username });
});

app.listen(5000, console.log("Server Running on http://localhost:5000"));