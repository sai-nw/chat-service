
const User = require("../models/User");
const Message = require("../models/Message");
const Conversation = require('../models/ConversationMap');
const mediaConfig = require('../config/media.js');
const messageStatusConfig = require('../config/message_status');
const conversationController = require('../controllers/conversationController');
const dateHelper = require('../helpers/dateHelper');
const mediaHelper = require('../helpers/mediaHelper');
const aliOssHelper = require('../helpers/alibaba-oss.js');

const storeMessage = async (data, readStatus) => {

  var chatMessage = new Message({
    conversation_map_id: null,
    image: data.image,
    message: data.message,
    status: readStatus,
    receiver_id: data.receiverId,
    sender_id: data.senderId,
    messageAt: new Date()
  });

  chatMessage.save();
  console.log("Message was stored to database");

  var conversation = await conversationController.checkConversation({ "receiverId": data.receiverId, "senderId": data.senderId });

  if (conversation == null) {

    var newConversation = await conversationController.newConversation({
      "senderId": data.senderId,
      "receiverId": data.receiverId,
      "blockBy": null,
      "last_message_id": chatMessage._id
    });
    Message.updateOne(
      { "_id": chatMessage._id },
      {
        $set: { "conversation_map_id": newConversation._id }
      }).exec();
  }
  else {

    Conversation.updateOne(
      { "_id": conversation._id },
      { $set: { "last_message_id": chatMessage._id } }
    ).exec()

    Message.updateOne(
      { "_id": chatMessage._id },
      {
        $set: { "conversation_map_id": conversation._id }
      }).exec();
  }

  return toDto(chatMessage);
}

const getMessages = async (data) => {
  var nextMessageId = data.nextMessageId;
  var perPage = 20;

  if (nextMessageId != null) {
    var search = {
      $or: [
        { $and: [{ "sender_id": data.senderId, "receiver_id": data.receiverId }] },
        { $and: [{ "sender_id": data.receiverId, "receiver_id": data.senderId }] }
      ]
    };

    if (nextMessageId != 0) {
      var search = {
        $or: [
          { $and: [{ "_id": { $lte: data.nextMessageId }, "sender_id": data.senderId, "receiver_id": data.receiverId }] },
          { $and: [{ "_id": { $lte: data.nextMessageId }, "sender_id": data.receiverId, "receiver_id": data.senderId }] }
        ],
      }
    }

    var messages = await Message.find(search)
      .sort({ "messageAt": -1 })
      .limit(perPage + 1);

    if (messages.length > perPage) {
      nextMessageId = messages[perPage]._id;
      messages.pop();
    }
    else {
      nextMessageId = null;
    }

    return {
      messages: messages.map(message => {
        return toDto(message)
      }),
      nextMessageId: nextMessageId
    };

  }

  return {
    messages: [],
    nextMessageId: null
  };
}

const removedMessage = async (data) => {
  Message.deleteOne({ '_id': data._id}).exec();
  if(data.image != null){
    if(mediaConfig.cloud_upload_enabled == 'true') {
      aliOssHelper.deleteFile(data.image);
    }
    mediaHelper.deleteFileFromAkoneyaMedia(mediaConfig.path + data.image);
  }
  Conversation.findOne({"last_message_id": data._id }).then(conversation => {
    if (conversation) {
      Message.findOne({"conversation_map_id": conversation._id }).sort({_id:-1}).then(newLastMessage => {
        var newLastMessageId = newLastMessage ? newLastMessage._id : null;
        Conversation.updateOne(
          { "_id": conversation._id },
          { $set: { "last_message_id": newLastMessageId} }
        ).exec();
      });
    }
  });
}

const toDto = (chatMessage) => {
  return {
    'id': chatMessage._id,
    'message': chatMessage.message,
    'image': chatMessage.image ? mediaConfig.url + chatMessage.image : null,
    'status': chatMessage.status,
    'senderId': chatMessage.sender_id,
    'receiverId': chatMessage.receiver_id,
    'messageAt': dateHelper.getStandardFormat(chatMessage.messageAt)
  };
}

const getUnreadMessagesCount = async (data) => {

  let unreadMessagesCount = await Message.countDocuments({
    "status": { $ne: messageStatusConfig.seen },
    "sender_id": data.senderId,
    "receiver_id": data.receiverId
  });

  return unreadMessagesCount;
}

const getMessageForConversationList = async (data) => {

  let user = await User.findOne({ 'client_user_id': data.senderId });

  let unReadCount = await getUnreadMessagesCount(data);

  let lastMessage = {
    id: data.id,
    activeStatus: true,
    unreadMessagesCount: unReadCount,
    user: {
      id: data.senderId,
      name: user.name,
      profile: user.image,
    },
    lastMessage: {
      isSender: false,
      message: data.message,
      image: data.image,
      messageAt: dateHelper.getStandardFormat(data.messageAt)
    }
  };
  return lastMessage;
}

const updateSeenStatus = (conversationMapId,socketUserId) => {

  Message.updateMany(
    {
      "receiver_id": socketUserId,
      "status": { $ne: messageStatusConfig.seen }
    },
    {
      $set: { "status": messageStatusConfig.seen, "conversation_map_id": conversationMapId }
    }
  ).exec();

}

exports.remove = async (req,res) => {

  let userId1 = req.body.userId1;
  let userId2 = req.body.userId2;

  let conversation = await Conversation.findOne({
    $or: [
        { $and: [{ "client_user_id_1": userId1, "client_user_id_2": userId2 }] },
        { $and: [{ "client_user_id_1": userId2, "client_user_id_2": userId1 }] }
      ]
  });

  if(conversation) {
    Message.deleteMany({"conversation_map_id": conversation._id}).then(result => {
      Conversation.deleteOne({"_id":conversation._id}).then(result => {
        res.json({
          "result": null,
          "statusCode": 200,
          "message": "Success"
        });
      });
    });
  }
  else{
    res.json({
      "result": null,
      "statusCode": 422,
      "message": "Fail"
    });
  }
}

exports.storeMessage = storeMessage;
exports.getMessages = getMessages;
exports.removedMessage = removedMessage;
exports.getUnreadMessagesCount = getUnreadMessagesCount;
exports.getMessageForConversationList = getMessageForConversationList;
exports.updateSeenStatus = updateSeenStatus;