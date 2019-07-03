var mongoose = require("mongoose");

var restaurantSchema = new mongoose.Schema({
    name: String,
    image: String,
    description: String,
    location: String,
    cuisine: String,
    phone: Number,
    reviews: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Review"
    }]
});

module.exports = mongoose.model("Restaurant", restaurantSchema);