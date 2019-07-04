var mongoose = require("mongoose");

var restaurantSchema = new mongoose.Schema({
    name: String,
    image: String,
    description: String,
    location: String,
    cuisine: String,
    phone: Number,
    author: {
        id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        },
        username: String
    },
    reviews: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Review"
    }]
});

module.exports = mongoose.model("Restaurant", restaurantSchema);