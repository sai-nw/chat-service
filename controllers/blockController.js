
const Conversation = require('../models/ConversationMap');
const conversationController = require('../controllers/conversationController');
const User = require("../models/User");
exports.blockTo = async (data, blockBy) => {

    var conversation = await conversationController.checkConversation({ "receiverId": data.blockTo, "senderId": blockBy });

    if (conversation) {
        var block = await conversation.updateOne({ $set: { "blockBy": blockBy } });
        return block;
    } else {

        var newConversation = await conversationController.newConversation({
            "senderId": blockBy,
            "receiverId": data.blockTo,
            "blockBy": blockBy,
            "last_message_id": null
        });
        return newConversation;

    }
};

exports.unBlockTo = async (data, unBlockBy) => {

    var unblock = null;

    var blockedUser = await Conversation.findOne(
        {
            $or: [
                { $and: [{ "blockBy": unBlockBy, "client_user_id_1": data.unBlockTo }] },
                { $and: [{ "blockBy": unBlockBy, "client_user_id_2": data.unBlockTo }] },
            ]
        }
    );
    if (blockedUser) {
        var unblock = blockedUser.updateOne({ $set: { "blockBy": null } });
        return unblock;
    }
    else {
        return unblock;
    }

}
