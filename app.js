require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const passport = require("passport");
const session = require('express-session');
const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require('mongoose-findorcreate');
const nodemailer = require("nodemailer");
const {uuid} = require('uuidv4');

const app = express();
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

app.use(session({
  secret: "Our little secret.",
  resave: false,
  saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb+srv://puneet:puneet@cluster0.trdd6ez.mongodb.net/erpDB");
// mongodb+srv://puneet:puneet@cluster0.trdd6ez.mongodb.net/trickDB
// mongodb://127.0.0.1:27017/trickShotDB

const Registeration = new mongoose.Schema({
  email: String,
  password: String,
  name: String,
  city: String,
  googleId: String
});

const sellerSchema = new mongoose.Schema({
  sellerId: String,
  email: String,
  password: String,
});

const Contacts = new mongoose.Schema({
  firstname: String,
  lastname: String,
  email: String,
  mobile_no: String,
  message: String
});


const bookingSchema = new mongoose.Schema({
  turfName: String,
  location: String,
  check_in_date: String,
  timeSlot: String,
  members: String
});

const invenTorySchema = new mongoose.Schema({
  sellerId: String,
  iId:String,
  turfName: String,
  location: String,
  image_icon: String,
  check_in_date: String,
  timeSlot: String,
  members: String
});

const subscriptionSchema = new mongoose.Schema({
  email: String
});

Registeration.plugin(passportLocalMongoose); //hashing and salting of password
Registeration.plugin(findOrCreate);

const Registers = mongoose.model("Register", Registeration);
const Booking = mongoose.model("Booking", bookingSchema);
const Contact = mongoose.model("Contact", Contacts);
const Inventory = mongoose.model("Inventory", invenTorySchema);
const Subscription = mongoose.model("Subscription", subscriptionSchema);
const Seller = mongoose.model("Seller", sellerSchema);



passport.use(Registers.createStrategy());
passport.serializeUser(function(user, cb) {
  process.nextTick(function() {
    cb(null, { id: user.id, username: user.username });
  });
});
passport.deserializeUser(function(user, cb) {
  process.nextTick(function() {
    return cb(null, user);
  });
});

passport.use(new GoogleStrategy({
  clientID: "51813200070-ljrf2b35kg8ghpeqrg5efvot4pp8ak4v.apps.googleusercontent.com",
  clientSecret: "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",
  callbackURL: "http://localhost:3000/auth/google/turf_booking"
},
  function (accessToken, refreshToken, profile, cb) {
    console.log(profile);
    Registers.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));

// Registeration
app.get("/Registeration.html", function (req, res) {
  res.sendFile(__dirname + "/Registeration.html");
});


app.get("/auth/google",
  passport.authenticate('google', { scope: ["profile"] })
);

app.get("/auth/google/turf_booking",
  passport.authenticate('google', { failureRedirect: "/SignIn.html" }),
  function (req, res) {
    // Successful authentication, redirect to secrets.
    res.redirect("/");
  });

app.get("/", function (req, res) {
  res.sendFile(__dirname + "/dicee.html");
})

app.post("/Registeration.html", function (req, res) {

  Registers.register({ username: req.body.username, name: req.body.name, city: req.body.city }, req.body.password, function (err, user) {
    if (err) {
      console.log(err);
      console.log("Not Registered");
      res.redirect("/Registeration.html");
    } else {
      console.log("Registered In");
      passport.authenticate("local")(req, res, function () {
        res.redirect("/");
      });
    }
  });
});


// SignIn
app.get("/SignIn.html", function (req, res) {
  res.sendFile(__dirname + "/SignIn.html");
});

// app.post("/SignIn.html", passport.authenticate("local", {
//   successRedirect: "/",
//   failureRedirect: "/SignIn.html"
// }));

app.post("/SignIn.html", passport.authenticate("local", {
  successRedirect: "/",
  failureRedirect: "/SignIn.html",
  failureFlash: true
}));


app.get("/explore.html", function (req, res) {
  res.sendFile(__dirname + "/explore.html");
})

app.get("/contact.html", function (req, res) {
  res.sendFile(__dirname + "/contact.html");
})

// Admin
app.get("/admin", async function (req, res) {
  const products = await Inventory.find({});
  const users = await Registers.find({});
  const bookings = await Booking.find({});
  const subscribers = await Subscription.find({});

  console.log(products); 
  res.render('admin', { products: products , users: users, bookings: bookings, subscribers: subscribers});
});

// Subscribe
app.get("/subscribe", function (req, res) {
  res.sendFile(__dirname + "/subscribe.html");
});

app.post("/subscribe", async function (req, res) {
  try{
    var email = req.body.email;
    const b4 = new Subscription({
      email: email
    });
  await b4.save();
  await main3(email).catch(console.error);
  res.redirect("/");
  }catch(error){
    console.log(error);
    res.render('error', { error: error });
  }
});

// Admin

app.get("/adminlogin",async function(req,res){
  res.sendFile(__dirname + "/adminlogin.html");
});
app.post("/adminlogin", async function (req, res) {
  try{
    const email = req.body.email;
    const password = req.body.password;
    if(email === "Admin" && password === "Admin"){
      res.redirect("/admin");
    }else{
      res.render("Admin login error");
    }
  }catch(error){
    console.log(error);
  }
});

app.get("/admin", async function (req, res) {
  res.render('admin');
});

app.get("/admin/inventories", async function (req, res) {
  const products = await Inventory.find({});
  console.log(products);
  res.render('adminP', { products: products });
});

app.get("/admin/bookings", async function (req, res) {
  const bookings = await Booking.find({});
  console.log(bookings);
  res.render('adminB', { products: bookings });
});

app.get("/admin/subscribers", async function (req, res) {
  const subscribers = await Subscription.find({});
  console.log(subscribers);
  res.render('adminSub', { products: subscribers });
});

app.get("/admin/users", async function (req, res) {
  const users = await Registers.find({});
  console.log(users);
  res.render('adminS', { products: users });
});

app.get("/admin/sellers", async function (req, res) {
  const sellers = await Seller.find({});
  console.log(sellers);
  res.render('adminS', { products: sellers });
});

// Seller
var sellerId = "";

app.get("/sellerSignIn", function (req, res) {
  res.sendFile(__dirname + "/sellerSignIn.html");
});

app.post("/sellerSignIn", async function (req, res) {
  var email = req.body.email;
  var password = req.body.password;

  sellerId = uuid();
  console.log(sellerId);

  const seller = Seller({
    sellerId:String(sellerId),
    email: email,
    password: password
  });
  await seller.save();
  res.redirect("/seller");
});

app.get("/sellerlogin",async function(req,res){
  res.sendFile(__dirname + "/sellerlogin.html");
});

app.post("/sellerlogin", async function (req, res) {
  try{
    var email = req.body.email;
    var password = req.body.password;

  const user = await Seller.findOne({email:email,password:password});
  if(user){
    sellerId = user.sellerId;
    res.redirect("/seller");
  }else{
    res.redirect("/sellerlogin");
  }
  }catch(error){
    console.log(error);
  }
});

app.get("/sellerAddProduct", function (req, res) {
   res.sendFile(__dirname + "/sellerAddProduct.html");
});

app.get("/seller", async function (req, res) {
  if(sellerId === ""){
    res.redirect("/sellerSignIn");
  }else{
    console.log(sellerId);
    const products = await Inventory.find({sellerId:sellerId});
    console.log(products);
    res.render('seller', { products: products });
  }
});

app.post("/deleteProduct", async function (req, res) {
  const iId = req.body.iId;
  try{
    const response = await Inventory.deleteOne({iId:iId});
    console.log(response);
    res.redirect("/seller");
  }catch(error){
    console.log(error);
  }
});

app.post("/seller", async function (req, res) {
  var turfName = req.body.turfName;
  var location = req.body.location;
  var image_icon = req.body.image_icon;
  const seller = await Seller.findOne({sellerId:sellerId});
  var email = seller.email;
  const b1 = new Inventory({
    sellerId: String(sellerId),
    iId: String(uuid()),
    turfName: turfName,
    location: location,
    image_icon: image_icon
  });
  await b1.save();
  // send mail with defined transport object
  await main(sellerId,email,turfName,location).catch(console.error);
  
  res.redirect("/seller");
});

async function main(sellerId,email,turfName,location) {
  var transport = nodemailer.createTransport({
  host: "sandbox.smtp.mailtrap.io",
  port: 2525,
  auth: {
    user: "4f6b717a21806e",
    pass: "0989c009cbbb45"
  }
});

  let info = await transport.sendMail({
    from: "ak@gmail.com", 
    to: email, 
    subject: "Turf Booking Website Team", 
    // This is for the Gmail
    text: "Hi! Your Added turf is: " + turfName + "\n Turf Location is: " + location ,
    html:"<b>Your Seller ID is: "+sellerId+"</b>"
    });

  }

  async function main1(email,turfName,location,check_in_date,check_out_date,timeSlot,members,phone) {
  var transport = nodemailer.createTransport({
  host: "sandbox.smtp.mailtrap.io",
  port: 2525,
  auth: {
    user: "4f6b717a21806e",
    pass: "0989c009cbbb45"
  }
});

  let info = await transport.sendMail({
    from: "ak@gmail.com", 
    to: email, 
    subject: "Turf Booking Website Team", 
    // This is for the Gmail
    text: "Hi! Your Booked turf is: " + turfName + "\n Turf Location is: " + location + "\n Check In Date is: " + check_in_date + "\n Check Out Date is: " + check_out_date + "\n Time Slot is: " + timeSlot + "\n Members are: " + members + "\n Phone Number is: " + phone,
    });

  }
  async function main2(email,firstname,lastname,mobile,message) {
  var transport = nodemailer.createTransport({
  host: "sandbox.smtp.mailtrap.io",
  port: 2525,
  auth: {
    user: "4f6b717a21806e",
    pass: "0989c009cbbb45"
  }
});

  let info = await transport.sendMail({
    from: "ak@gmail.com", 
    to: email, 
    subject: "Turf Booking Website Team", 
    // This is for the Gmail
    text: "Hi! Your Feedback is: " + message + "\n Your Name is: " + firstname + " " + lastname + "\n Your Mobile Number is: " + mobile 
    });

  }

  async function main3(email) {
  var transport = nodemailer.createTransport({
  host: "sandbox.smtp.mailtrap.io",
  port: 2525,
  auth: {
    user: "4f6b717a21806e",
    pass: "0989c009cbbb45"
  }
});

  let info = await transport.sendMail({
    from: "ak@gmail.com", 
    to: email, 
    subject: "Turf Booking Website Team", 
    // This is for the Gmail
    text: "You have Subscribed to our Website",
    html:"<b>Thank You for Subscribing</b>"
    });

  }


app.listen(3000, function () {
  console.log("Server is running on port 3000");
})


var id = "";

var inventory = [];

app.get("/booking.ejs", async function (req, res) {
  if (req.isAuthenticated()) {
    inventory = await Inventory.find({});
    console.log(inventory);
    res.render('booking', { turfImage: inventory });
  } else {
    res.redirect("/Registeration.html");
  }
})
app.post("/booking.ejs", function (req, res) {
  id = String(req.body.turf);
  console.log(id);
  res.redirect("/booking1");
  // })
})

var bool = false;
app.get("/booking1", async function (req, res) {
  inventory.forEach(function (turf1) {
    if (id === turf1.iId) {
      var array = turf1;
      bool = true;
      if (bool) {
        // console.log(turf.image_icon);
        res.render('booking1', { oneturf: array });
      }
    }
  });
})

app.get("/book_now.ejs", async function (req, res) {
  inventory.forEach(function (turf) {
    if (id === turf.iId) {
      var array = turf;
      res.render('book_now', { oneturf: array });
    }
  });
});

app.post("/book_now", async function (req, res) {
  var turfName = req.body.turfName;
  var location = req.body.location;
  var check_in_date = req.body.check_in_date;
  var check_out_date = req.body.check_out_date;
  var timeSlot = req.body.timeslot;
  var members = req.body.members;
  var email = req.body.email;
  var phone = req.body.phone;




  const b2 = new Booking({
    turfName: turfName,
    location: location,
    check_in_date: check_in_date,
    timeSlot: timeSlot,
    members: members
  });
  await b2.save();
  
  await main1(email,turfName,location,check_in_date,check_out_date,timeSlot,members,phone).catch(console.error);
  res.redirect("/successful.html");
})

app.post("/contact.html", async function (req, res) {
  var firstname = req.body.firstname;
  var lastname = req.body.lastname;
  var email = req.body.email;
  var mobile = req.body.mobile;
  var message = req.body.feedback;

  const b5 = new Contact({
    firstname: firstname,
    lastname: lastname,
    email: email,
    mobile_no: mobile,
    message: message
  });
  await b5.save();
  await main2(email,firstname,lastname,mobile,message).catch(console.error);
  res.redirect("/successful1.html")

})

// app.get("/book_now.ejs",function(req,res){
//     res.render('book_now',{oneturf:array});
// });

app.get("/successful.html", function (req, res) {
  res.sendFile(__dirname + "/successful.html");
})
app.get("/successful1.html", function (req, res) {
  res.sendFile(__dirname + "/successful1.html");
})


