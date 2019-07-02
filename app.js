var express     = require('express'),
app             = express(),
mongoose        = require('mongoose'),
restaurant      = require('./models/restaurant');

mongoose.connect("mongodb://localhost:27017/savour_db", {useNewUrlParser : true});
app.set('view engine','ejs');
app.use(express.static(__dirname + '/public'));

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
app.get("/", function(req, res){
    res.render("landing");
});

app.get("/restaurants", function(req, res){
    restaurant.find({}, function(err, foundRestaurants){
        if(err){
            console.log(err);
        } 
        res.render("restaurant/index", {restaurants : foundRestaurants});
    })
});

app.get("/restaurants/:id", function(req, res){
    restaurant.findById(req.params.id, function(err, restaurant){
        if(err){
            console.log(err);
        }
        res.render("restaurant/show", {restaurant : restaurant});
    })
});

//Server setting
app.listen(process.env.PORT || 3000, function(){
    console.log("Savour server has started");
})
