const express = require('express');;
const app = express();
const mongoose = require('mongoose');
const mongo_url="mongodb://127.0.0.1:27017/wonderlust";
const Listing=require("./models/listing.js");
const path=require("path");
const methodOverride=require("method-override");
const ejsMate=require("ejs-mate");
const wrapAsync=require("./utils/wrapAsync.js"); 
const ExpressError=require("./utils/ExpressError.js"); 

app.set("view engine","ejs");
app.set("views",path.join(__dirname,"/views"));
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));
app.engine("ejs",ejsMate);
app.use(express.static(path.join(__dirname,"/public")));
app.use(express.json()); 


main().then(()=>{
    console.log("connected to mongoDB");
})
.catch((err)=>{
    console.log(err);
});

async function main(){
    await mongoose.connect(mongo_url);
}


// app.get("/testListing",async(req,res)=>{
//     let sampleListing=new listing({
//         title:"my new villa",
//         description:"by the beach", 
//         price:1000,
//         location:"goa",
//         country:"india",
//     });
//     await sampleListing.save();
//     console.log("sample was saved");
//     res.send("successful testing");
// });

app.get("/",(req,res)=>{
    res.send("hi,i am root");
});

//Index Route
app.get("/listings", wrapAsync(async (req, res) => {
  const allListings = await Listing.find({});
  res.render("listings/index", { allListings });
}));

app.get("/listings/new", (req, res) => {
  res.render("listings/new.ejs");
});

app.get("/listings/:id", wrapAsync(async (req, res) => {
  let { id } = req.params;
  const listing = await Listing.findById(id);
  res.render("listings/show.ejs", { listing });
  
}));

app.post("/listings", wrapAsync(async (req, res,next) => {
    if(!req.body.listing) {
      throw new ExpressError(400,"Invalid Listing Data");
    }
    const newListing = new Listing(req.body.listing);
    await newListing.save();
    res.redirect("/listings");
}));

app.get("/listings/:id/edit",wrapAsync(async (req, res) => {
  let { id } = req.params;
  const listing = await Listing.findById(id);
  res.render("listings/edit.ejs", { listing });
}));

app.put("/listings/:id", wrapAsync(async (req, res) => {
  if(!req.body.listing) {
    throw new ExpressError(400,"Invalid Listing Data");
  }
  let { id } = req.params;
  await Listing.findByIdAndUpdate(id, {...req.body.listing });
  res.redirect(`/listings/${id}`);
}));

app.delete("/listings/:id", wrapAsync(async (req, res) => {
  let { id } = req.params;
  let deletedListing = await Listing.findByIdAndDelete(id);
  console.log(deletedListing);
  res.redirect("/listings");
}));

app.all(/.*/, (req, res, next) => {
  next(new ExpressError(404, "page not found"));
});

app.use((err, req, res, next) => {
  let { statusCode = 500, message = "something went wrong!" } = err;
  res.status(statusCode).send(message);
});

app.listen(8080, () => {
  console.log("server is running on port 8080");
});


