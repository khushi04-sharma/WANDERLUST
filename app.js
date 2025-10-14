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
const {listingSchema,reviewSchema}=require("./schema.js");
const Review=require("./models/review.js");

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

const validateListing=(req,res,next)=>{
  let {error}=listingSchema.validate(req.body);
  if(error){
    let errMsg=error.details.map((el)=>el.message).join(",");
    throw new ExpressError(400,errMsg);
  }else{
    next();
  }
}
const validateReview=(req,res,next)=>{
  let {error}=reviewSchema.validate(req.body);
  if(error){
    let errMsg=error.details.map((el)=>el.message).join(",");
    throw new ExpressError(400,errMsg);
  }else{
    next();
  }
}
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

app.post("/listings", validateListing,
  wrapAsync(async (req, res,next) => {
    // if(!req.body.listing) {
    //   throw new ExpressError(400,"Invalid Listing Data");
    // }
    // if (!newListing.title) {
    //     throw new ExpressError(400, "Title is missing!");
    // }

    // if (!newListing.description) {
    //     throw new ExpressError(400, "Description is missing!");
    // }

    // if (!newListing.location) {
    //     throw new ExpressError(400, "Location is missing!");
    // }
    const newListing = new Listing(req.body.listing);
    await newListing.save();
    res.redirect("/listings");
}));

app.get("/listings/:id/edit",wrapAsync(async (req, res) => {
  let { id } = req.params;
  const listing = await Listing.findById(id);
  res.render("listings/edit.ejs", { listing });
}));

app.put("/listings/:id",validateListing, wrapAsync(async (req, res) => {
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

app.post("/listings/:id/reviews",validateReview, wrapAsync(async (req, res) => {
  const { id } = req.params;
  const listing = await Listing.findById(id);
  if (!listing) {
    throw new ExpressError(404, "Listing not found");
  }

  if (!listing.reviews) listing.reviews = [];

  const newReview = new Review(req.body.review);
  await newReview.save();

  listing.reviews.push(newReview._id);
  await listing.save();

  console.log("New review saved");
  res.redirect(`/listings/${listing._id}`);
}));


app.all(/.*/, (req, res, next) => {
  next(new ExpressError(404, "page not found"));
});

app.use((err, req, res, next) => {
  let { statusCode = 500, message = "something went wrong!" } = err;
  res.status(statusCode).render("error.ejs",{message});
  //res.status(statusCode).send(message);
});

app.listen(8080, () => {
  console.log("server is running on port 8080");
});


