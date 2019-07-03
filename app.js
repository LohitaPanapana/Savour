var express     = require('express'),
app             = express(),
mongoose        = require('mongoose'),
bodyParser      = require('body-parser'),
methodOverride  = require('method-override'),
restaurant      = require('./models/restaurant'),
review          = require("./models/review");

mongoose.connect("mongodb://localhost:27017/savour_db", {useNewUrlParser : true});
mongoose.set('useFindAndModify', false);
app.set('view engine','ejs');
app.use(express.static(__dirname + '/public'));
app.use(bodyParser.urlencoded({extended : true}));
app.use(methodOverride("_method"));

// restaurant.create({
//     name: "Hawkers Asian Street FarThe Lobby Lounge & Terrace - Four Seasons Hotel",
//     image: "https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=1050&q=80",
//     location: "NO. 8 BELLARY ROAD BENGALURU, KARNATAKA 560032",
//     cuisine: "International",
//     phone: 8098345789
// }, function(err, createdRestaurant){
//     if(err){
//         console.log(err);
//     } else{
//         console.log(createdRestaurant);
//     }
// })

//Route configurations
//Root route
app.get("/", function(req, res){
    res.render("landing");
});

//Index route
app.get("/restaurants", function(req, res){
    restaurant.find({}, function(err, foundRestaurants){
        if(err){
            console.log(err);
        } 
        res.render("restaurant/index", {restaurants : foundRestaurants});
    })
});

//New route
app.get("/restaurants/new", function(req, res){
    res.render("restaurant/new")
});

//Create route
app.post("/restaurants", function(req, res){
    restaurant.create(req.body.restaurant, function(err, createdRestaurant){
        if(err){
            console.log(err);
        }
        res.redirect("/restaurants");
    })
})

//Show route
app.get("/restaurants/:id", function(req, res){
    restaurant.findById(req.params.id).populate("reviews").exec(function(err, restaurant){
        if(err){
            console.log(err);
        }
        res.render("restaurant/show", {restaurant : restaurant});
    })
});

//Edit route
app.get("/restaurants/:id/edit", function(req, res){
    restaurant.findById(req.params.id, function(err, foundRestaurant){
        if(err){
            console.log(err);
        } 
        res.render("restaurant/edit", {restaurant:foundRestaurant});
    })
})

//Update route
app.put("/restaurants/:id", function(req, res){
   restaurant.findByIdAndUpdate(req.params.id, req.body.restaurant, function(err, updatedRestaurant){
       if(err){
           console.log(err);
       }
       res.redirect("/restaurants/" + req.params.id);
   })
});

//Delete route
app.delete("/restaurants/:id", function(req, res){
    restaurant.findByIdAndRemove(req.params.id,function(err){
        if(err){
            console.log(err);
        }
        res.redirect("/restaurants");
    })
});

//Comments new route
app.get("/restaurants/:id/reviews/new", function(req, res){
    restaurant.findById(req.params.id, function(err, foundRestaurant){
        if(err){
            console.log(err);
        }
        res.render("review/new", {restaurant : foundRestaurant});
    })
});

//Comments create route
app.post("/restaurants/:id/reviews", function(req, res){
    restaurant.findById(req.params.id, function(err, restaurant){
        if(err){
            console.log(err);
            res.redirect("/restaurants");
        } else{
            review.create(req.body.review, function(err, createdReview){
                if(err){
                    console.log(err);
                    res.redirect("/restaurants");
                }
                restaurant.reviews.push(createdReview);
                restaurant.save();
                res.redirect("/restaurants/" + restaurant._id);
            });
        }
    });
});

//Comment edit route
app.get("/restaurants/:id/reviews/:review_id/edit", function(req, res){
    review.findById(req.params.review_id, function(err, fetchedReview){
        if(err){
            console.log("err");
        } else{
            res.render("review/edit", {review : fetchedReview, restaurant_id : req.params.id});
        }
    });
});

//Comment update route
app.put("/restaurants/:id/reviews/:review_id", function(req, res){
    review.findByIdAndUpdate(req.params.review_id, req.body.review, function(err, review){
        if(err){
            console.log(err);
        }
        res.redirect("/restaurants/" + req.params.id);
    })
});

//Comment delete route
app.delete("/restaurants/:id/reviews/:review_id", function(req, res){
    review.findByIdAndRemove(req.params.review_id, function(err){
        if(err){
            console.log(err);
        }
        res.redirect("/restaurants/" + req.params.id);
    })
});

//Server setting
app.listen(process.env.PORT || 3000, function(){
    console.log("Savour server has started");
})
