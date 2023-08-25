const User = require('../models/User');
const Conversation = require('../models/ConversationMap');
const Message = require("../models/Message");
const mediaConfig = require('../config/media.js');
const { check, validationResult } = require('express-validator');
const dateHelper = require('../helpers/dateHelper');
const messageController = require('../controllers/messageController');

exports.index = async function (req, res) {
    var userId = req.body.clientUserId;
    var nextId = req.query.nextId;
    var perPage = 10;

    if (nextId != null) {

        var search = {
            "last_message_id": { $ne: null },
            $or: [{ "client_user_id_1": userId }, { "client_user_id_2": userId }]
        };

        if (nextId != 0) {
            var search = {
                "last_message_id": { $lte: nextId , $ne : null },
                $or: [{ "client_user_id_1": userId }, { "client_user_id_2": userId }]
            };
        }

        await Conversation.find(search)
            .populate(['user_id_1', 'user_id_2', 'last_message_id'])
            .sort({ "last_message_id": -1 })
            .limit(perPage + 1)
            .then(async conversations => {

                var chattedConversations = conversations.map(conversation => {
                    var resultConversations = { "userInfo": null, "chatInfo": null };

                    resultConversations.userInfo = conversation.user_id_1;

                    if (conversation.client_user_id_1 == userId) {
                        resultConversations.userInfo = conversation.user_id_2;
                    }

                    resultConversations.chatInfo = {
                        id: conversation._id,
                        nextId: conversation.last_message_id._id,
                        lastMessage: conversation.last_message_id.message,
                        lastMessageImage: conversation.last_message_id.image,
                        lastMessageAt: conversation.last_message_id.messageAt,
                        lastMessageSenderId: conversation.last_message_id.sender_id
                    }

                    return resultConversations;
                });

                if (chattedConversations.length > perPage) {
                    nextId = chattedConversations[perPage].chatInfo.nextId;
                    chattedConversations.pop();
                }
                else {
                    nextId = null;
                }

                let cvs = [];

                for (let conversation of chattedConversations) {

                    let response = {
                        id: conversation.chatInfo.id,
                        activeStatus: conversation.userInfo.socket_id != null,
                        unreadMessagesCount: 0,
                        user: {
                            id: conversation.userInfo.client_user_id,
                            name: conversation.userInfo.name,
                            profile: conversation.userInfo.image,
                        },
                        lastMessage: {
                            isSender: conversation.chatInfo.lastMessageSenderId == userId,
                            message: conversation.chatInfo.lastMessage,
                            image: conversation.chatInfo.lastMessageImage != null ? mediaConfig.url + conversation.chatInfo.lastMessageImage : null,
                            messageAt: dateHelper.getStandardFormat(conversation.chatInfo.lastMessageAt),
                        }
                    };

                    response.unreadMessagesCount = await messageController.getUnreadMessagesCount({
                        senderId: conversation.userInfo.client_user_id,
                        receiverId: userId
                    });

                    cvs.push(response);
                }

                let result = {
                    "data": cvs,
                    "pagination": {
                        "nextId": nextId
                    }
                };

                res.statusCode = 200;
                res.json({
                    "result": result,
                    "statusCode": 200,
                    "message": "Success"
                });
            });
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

exports.users = async function (req, res) {
    var userId = req.body.clientUserId;
    var nextId = req.query.nextId;
    var perPage = 10;
    let searchKeyword = req.query.keyword ? req.query.keyword.trim() : "";
    let chattedUserIds = [];

    if (nextId != null) {

        let conversations = await Conversation.find(
            {
                "last_message_id": { $ne: null },
                $or: [{ "client_user_id_1": userId }, { "client_user_id_2": userId }]
            });

        chattedUserIds = conversations.map(conversation => {
            if (conversation.client_user_id_1 == userId) {
                return conversation.user_id_2;
            }
            else {
                return conversation.user_id_1;
            }
        });

        var search = {
            "_id": { $in: chattedUserIds },
            "name": { $regex: searchKeyword, $options: 'i' }
        };

        if (nextId != 0) {
            var search = {
                $and: [
                    { "_id": { $in: chattedUserIds } },
                    { "_id": { $lte: nextId } }
                ],
                "name": { $regex: searchKeyword, $options: 'i' }
            };
        }

        let users = await User.find(search)
            .sort({ "_id": -1 })
            .limit(perPage + 1);

        if (users.length > perPage) {
            nextId = users[perPage]._id;
            users.pop();
        }
        else {
            nextId = null;
        }

        users = users.map(user => {
            return {
                id: user.client_user_id,
                name: user.name,
                profile: user.image,
            };
        });

        let result = {
            "data": users,
            "pagination": {
                "nextId": nextId
            }
        };

        res.statusCode = 200;
        res.json({
            "result": result,
            "statusCode": 200,
            "message": "Success"
        });
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

exports.checkConversation = async function (req) {

    const conversation = await Conversation.findOne({
        $or: [
            { "client_user_id_1": req.receiverId, "client_user_id_2": req.senderId },
            { "client_user_id_1": req.senderId, "client_user_id_2": req.receiverId }
        ]
    });
    return conversation;
}

exports.newConversation = async function (req) {

    var sender = await User.findOne({ "client_user_id": req.senderId });
    var receiver = await User.findOne({ "client_user_id": req.receiverId });

    var newConversation = await new Conversation({
        client_user_id_1: req.senderId,
        client_user_id_2: req.receiverId,
        user_id_1: sender._id,
        user_id_2: receiver._id,
        last_message_id: req.last_message_id,
        blockBy: req.blockBy
    });
    newConversation.save();
    return newConversation;
}



