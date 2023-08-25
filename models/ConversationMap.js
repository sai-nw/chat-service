const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const conversationMapSchema = new Schema(
    {
        client_user_id_1: Number,
        client_user_id_2: Number,
        user_id_1: {
            type: Schema.Types.ObjectId,
            ref: "User"
        },
        user_id_2: {
            type: Schema.Types.ObjectId,
            ref: "User"
        },
        last_message_id: {
            type: Schema.Types.ObjectId,
            ref: "Message"
        },
        blockBy: Number
    }
);

let ConversationMapSchema = mongoose.model("ConversationMap", conversationMapSchema);

module.exports = ConversationMapSchema;