const mongoose = require('mongoose');
mongoose.set('useFindAndModify', false);

const Schema = mongoose.Schema;

const userSchema = new Schema(
    {
        client_user_id: Number,
        name: String,
        image: String,
        phone: String,
        email: String,
        socket_id: String,
        chatTo: Number,
        lastActiveAt: Date,
    },
    {
        timestamps: true
    }
);

let User = mongoose.model("User", userSchema);

module.exports = User;