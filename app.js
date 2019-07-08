require('dotenv').config();
var express     = require('express'),
app             = express(),
mongoose        = require('mongoose'),
bodyParser      = require('body-parser'),
methodOverride  = require('method-override'),
expressSession  = require('express-session'),
passport        = require('passport'),
flash           = require('connect-flash'),
passportLocal   = require('passport-local'),
restaurant      = require('./models/restaurant'),
review          = require("./models/review"),
user            = require("./models/user");

mongoose.connect("mongodb://localhost:27017/savour_db", {useNewUrlParser : true});
mongoose.set('useFindAndModify', false);
app.set('view engine','ejs');
app.use(express.static(__dirname + '/public'));
app.use(bodyParser.urlencoded({extended : true}));
app.use(methodOverride("_method"));
app.use(flash());
app.use(expressSession({
    secret: 'Change is beautiful',
    resave: false,
    saveUninitialized: false
}));
app.locals.moment = require('moment');
app.use(passport.initialize());
app.use(passport.session());
passport.use(new passportLocal(user.authenticate()));
passport.serializeUser(user.serializeUser());
passport.deserializeUser(user.deserializeUser());

//Route configurations
app.use(function(req, res, next){
    res.locals.currentUser = req.user;
    res.locals.success = req.flash("success");
    res.locals.error = req.flash("error");
    next();
});

//Root route
app.get("/", function(req, res){
    res.render("landing");
});

//Index route
app.get("/restaurants", function(req, res){
    if(req.query.search){
        const regexString = new RegExp(escapeRegex(req.query.search), 'gi');
        restaurant.find({$or: [{"location" : regexString},{ "name" : regexString},{ "cuisine" : regexString}]}, function(err, foundRestaurants){
            if(err){
                req.flash("error", "Something went wrong");
                redirect("back");
            } 
            res.render("restaurant/index", {restaurants : foundRestaurants});
        })
    } else{
        restaurant.find({}, function(err, foundRestaurants){
            if(err){
                req.flash("error", "Something went wrong");
                redirect("back");
            } 
            res.render("restaurant/index", {restaurants : foundRestaurants});
        })
    }
});

//New route
app.get("/restaurants/new", isLoggedIn, function(req, res){
    res.render("restaurant/new")
});

//Create route
app.post("/restaurants", isLoggedIn, function(req, res){
    var author = {
        id: req.user._id,
        username: req.user.username
    }
    req.body.restaurant.author = author;
    restaurant.create(req.body.restaurant, function(err, createdRestaurant){
        if(err){
            req.flash("error", "Something went wrong");
            res.redirect("back");
        }
        req.flash("success","Restaurant is added successfully");
        res.redirect("/restaurants");
    })
})

//Show route
app.get("/restaurants/:id", function(req, res){
    restaurant.findById(req.params.id).populate("reviews").exec(function(err, restaurant){
        if(err || !restaurant){
            req.flash("error", "Restaurant doesn't exists");
            res.redirect("/restaurants");
        }
        review.aggregate([
            {   $match: {_id: {$in: restaurant.reviews}}},
            {   $group: {_id:restaurant._id, average:{$avg: '$rating'}}}
        ], function(err, result){
            restaurant.rating = Math.round(result[0].average * 10)/10;
            restaurant.save();
        })
        res.render("restaurant/show", {restaurant : restaurant});
    })
});

//Edit route
app.get("/restaurants/:id/edit", checkRestaurantOwnership, function(req, res){
    restaurant.findById(req.params.id, function(err, foundRestaurant){
        if(err){
            req.flash("error", "Something went wrong");
            res.redirect("back");
        } 
        res.render("restaurant/edit", {restaurant:foundRestaurant});
    })
})

//Update route
app.put("/restaurants/:id", checkRestaurantOwnership, function(req, res){
   restaurant.findByIdAndUpdate(req.params.id, req.body.restaurant, function(err, updatedRestaurant){
       if(err){
        req.flash("error", "Something went wrong");
        res.redirect("back");
       }
       req.flash("success", "Restaurant is updated successfully");
       res.redirect("/restaurants/" + req.params.id);
   })
});

//Delete route
app.delete("/restaurants/:id", checkRestaurantOwnership, function(req, res){
    restaurant.findByIdAndRemove(req.params.id,function(err){
        if(err){
            req.flash("error", "Something went wrong");
            res.redirect("back");
        }
        req.flash("success", "Deleted successfully");
        res.redirect("/restaurants");
    })
});

//Comments new route
app.get("/restaurants/:id/reviews/new", isLoggedIn, function(req, res){
    restaurant.findById(req.params.id, function(err, foundRestaurant){
        if(err){
            req.flash("error", "Something went wrong");
            res.redirect("back");
        }
        res.render("review/new", {restaurant : foundRestaurant});
    })
});

//Comments create route
app.post("/restaurants/:id/reviews", isLoggedIn, function(req, res){
    restaurant.findById(req.params.id, function(err, restaurant){
        if(err){
            req.flash("error", "Something went wrong");
            res.redirect("back");
        } else{
            review.create(req.body.review, function(err, createdReview){
                if(err){
                    console.log(err);
                    res.redirect("/restaurants");
                }
                createdReview.author.id = req.user._id;
                createdReview.author.username = req.user.username;
                createdReview.save();
                restaurant.reviews.push(createdReview);
                restaurant.save();
                req.flash("success", "Review added successfully");
                res.redirect("/restaurants/" + restaurant._id);
            });
        }
    });
});

//Comment edit route
app.get("/restaurants/:id/reviews/:review_id/edit", checkReviewOwnerShip, function(req, res){
    review.findById(req.params.review_id, function(err, fetchedReview){
        if(err){
            req.flash("error", "Something went wrong");
            res.redirect("back");
        } else{
            res.render("review/edit", {review : fetchedReview, restaurant_id : req.params.id});
        }
    });
});

//Comment update route
app.put("/restaurants/:id/reviews/:review_id", checkReviewOwnerShip, function(req, res){
    review.findByIdAndUpdate(req.params.review_id, req.body.review, function(err, review){
        if(err){
            req.flash("error", "Something went wrong");
            res.redirect("back");
        }
        req.flash("success","Review updated successfully");
        res.redirect("/restaurants/" + req.params.id);
    })
});

//Comment delete route
app.delete("/restaurants/:id/reviews/:review_id", checkReviewOwnerShip, function(req, res){
    review.findByIdAndRemove(req.params.review_id, function(err){
        if(err){
            req.flash("error", "Something went wrong");
            res.redirect("back");
        }
        req.flash("success","Review deleted successfully");
        res.redirect("/restaurants/" + req.params.id);
    })
});

//Register route
app.get("/register", function(req, res){
    res.render("user/register");
});

app.post("/register", function(req, res){
    var newUser = new user({ username: req.body.username });
    user.register(newUser, req.body.password, function(err, createdUser){
        if(err){
            req.flash("error", "Something went wrong");
            res.redirect("back");
        }
        passport.authenticate("local")(req, res, function(){
            req.flash("success", "Welcome to Savour, " + createdUser.username);
            res.redirect("/restaurants");
        });
    })
});

//Login route
app.get("/login", function(req, res){
    res.render("user/login");
});

app.post("/login", passport.authenticate("local",{
    successRedirect: "/restaurants",
    failureRedirect: "/login",
    failureFlash: 'Invalid username or password',
    successFlash: 'Welcome back!'
}), function(req, res){
});

app.get("/logout", function(req, res){
    req.logout();
    req.flash("success", "Successfully, logged you out");
    res.redirect("/restaurants");
})

//Middleware
function isLoggedIn(req, res, next){
    if(req.isAuthenticated()){
        return next();
    }
    req.flash("error","You must be logged in to do this");
    res.redirect("back");
}

function checkRestaurantOwnership(req, res, next){
    if(req.isAuthenticated()){
        restaurant.findById(req.params.id, function(err, foundRestaurant){
            if(err || !foundRestaurant){
                req.flash("error","Restaurant not found");
                res.redirect("back");
            }
            else{
                if(foundRestaurant.author.id.equals(req.user.id)){
                    next();
                } else{
                    req.flash("error","You don't have enough permission to edit or delete this restaurant");
                }
            }
        })
    } else{
        req.flash("error","You must be logged in to do this");
        res.redirect("back");
    }
}

function checkReviewOwnerShip(req, res, next){
    if(req.isAuthenticated()){
        review.findById(req.params.review_id, function(err, foundReview){
            if(err){
                req.flash("error","Review not found");
                res.redirect("/restaurants");
            } else {
                if(foundReview.author.id.equals(req.user._id)){
                    next();
                } else{
                    req.flash("error","You don't have enough permission to edit or delete this review");
                    res.redirect("/");
                }
            }
        })
    } else{
        req.flash("error","You must be logged in to do this");
        res.redirect("back");
    }
}

function escapeRegex(text) {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
};

//Server setting
app.listen(process.env.PORT || 3000, function(){
    console.log("Savour server has started");
})
