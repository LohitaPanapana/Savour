var mongoose = require('mongoose');

var reviewSchema = new mongoose.Schema({
    name: String,
    title: String,
    content: String,
    rating: Number,
    author: {
        id: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User"
        },
        username: String 
    },
    createdAt: {
        type: Date,
        default: Date.now()
    }
});

module.exports = mongoose.model("Review", reviewSchema);