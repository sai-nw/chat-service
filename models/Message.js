const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const messageSchema = new Schema(
    {
        conversation_map_id: String,
        receiver_id: Number,
        sender_id: Number,
        message: String,
        image: String,
        status: String,
        messageAt: Date,
    }
);

let Message = mongoose.model("Message", messageSchema);
module.exports = Message;