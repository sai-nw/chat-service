const Conversation = require('../models/ConversationMap');
const Message = require('../models/Message');
const ObjectId = require("mongoose").Types.ObjectId;
const mediaConfig = require('../config/media.js');

exports.getImages = async function (req, res) {

    var userId = req.body.clientUserId;
    var senderId = req.body.senderId;
    var receiverId = req.body.receiverId;
    var nextId = req.query.nextId;
    var perPage = 10;

    if(nextId != null) {
        var search = {
            $or: [
                { $and: [{ "sender_id": senderId, "receiver_id": receiverId }] },
                { $and: [{ "sender_id": receiverId, "receiver_id": senderId }] }
            ],
            "image" : { $ne : null }
        }

        if (nextId != 0) {
            var search = {
                $or: [
                  { $and: [{ "sender_id": senderId, "receiver_id": receiverId }] },
                  { $and: [{ "sender_id": receiverId, "receiver_id": senderId }] }
                ],
                "_id": { $lte: nextId },
                "image" : { $ne : null }
            }
        }

        if(userId == senderId || userId == receiverId ) {

            await Message.find(search,{image : 1})
                .sort({ messageAt: -1 })
                .limit(perPage + 1).then(messages => {

                if (messages.length > perPage) {
                    nextId = messages[perPage].id;
                    messages.pop();
                }
                else {
                    nextId = null;
                }

                messages = messages.map(message => {
                    return {
                        id: message._id,
                        url: message.image ? mediaConfig.url + message.image : null
                    }
                });

                res.json({
                    "result": {
                        "data": messages,
                        "pagination": {
                            "nextId": nextId
                        }
                    },
                    "statusCode": 200,
                    "message": "Success"
                });

            });
        }
        else{
            res.json({
                "result": null,
                "statusCode": 400,
                "message": "Bad Request."
            });
        }
    }
    else {

        res.json({
            "result": {
                "data": [],
                "pagination": {
                    "nextId": null
                }
            },
            "statusCode": 200,
            "message": "Success"
        });
    }
    
};
