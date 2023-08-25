const request = require('request');
let fs = require('fs');

const mediaConfig = require('./config/media');
const uaaConfig = require('./config/uaa');
const dateHelper = require('./helpers/dateHelper');

const User = require("./models/User");
const Message = require("./models/Message");
const Conversation = require('./models/ConversationMap');
const messageController = require('./controllers/messageController');
const blockController = require('./controllers/blockController');
const userController = require('./controllers/userController');
const conversationController = require('./controllers/conversationController');
const messageStatusConfig = require('./config/message_status');

const aliOssHelper = require('./helpers/alibaba-oss.js');
const helper = require('./helpers/helper.js');

var sockets = {};

sockets.init = (server) => {

	var io = require('socket.io').listen(server);

	var dynamicTopic = (userId1, userId2) => {
		return userId1 < userId2 ? userId2 + '-' + userId1 : userId1 + '-' + userId2;
	}

	var updateAndNotify = (socket, isConnect) => {

		var lastActiveAt = isConnect ? null : new Date();

		var updateData = {
			"socket_id": socket.id,
			"lastActiveAt": lastActiveAt
		};

		if (!isConnect) {
			updateData.socket_id = null;
			updateData.chatTo = null;
		}

		User.findOneAndUpdate(
			{ "client_user_id": socket.userId },
			{ $set: updateData }
		).then(me => {
			if (me) {
				User.find(
					{ "chatTo": me.client_user_id },
				).then(users => {

					for (let user of users) {

						var topicPrefix = dynamicTopic(me.client_user_id, user.client_user_id);

						io.to(user.socket_id).emit(topicPrefix + '-show-active-status', {
							"lastActiveAt": dateHelper.getStandardFormat(lastActiveAt)
						});
					}
				});
			}
		});

	}

	var onConnect = (socket) => {

		var isFromWeb = socket.handshake.query.isFromWeb;

		if (isFromWeb) {
			socket.emit('access', { userId: socket.userId, userName: socket.userName });
		}

		updateAndNotify(socket, true);
	}


	io.sockets.use((socket, next) => {

		var token = 'Bearer ' + socket.handshake.query.token;

		request.get({
			url: uaaConfig.auth_url,
			headers: {
				"Authorization": token,
				"Accept": 'application/json'
			}
		},
			async function (error, response) {
				if (!error) {
					var responseJson = JSON.parse(response.body);
					if (responseJson.statusCode == 200) {
						var userId = responseJson.result.user.id;
						var user = await userController.createOrGetUser(userId, token, socket);
						socket.userId = user.client_user_id;
						socket.userName = user.name;
						next();
					}
				}
			});

	}).on('connection', function (socket) {

		onConnect(socket);

		socket.on('get-users', (data, callback) => {
			User.find({}).then(users => {
				callback(users);
			});
		});

		socket.on('get-messages', async (data, callback) => {
			data.senderId = socket.userId;
			var data = await messageController.getMessages(data);
			callback({ "messages": data.messages, "nextMessageId": data.nextMessageId });
		});

		socket.on('send-message', async (data, callback) => {
			data.senderId = socket.userId;
			if (data.image) {
				var imageName = "/chat/messages/" + helper.generate_image_name(".png");
				var imagePath = mediaConfig.path + imageName;

				const imageData = data.image;
				const base64Data = imageData.replace(/^data:([A-Za-z-+/]+);base64,/, '');
				file =  Buffer.from(base64Data, 'base64');
				var imageSize = file.length/1024;
			
				if(imageSize > mediaConfig.imageSizeLimit){
					data.image = null;
				}else{
					fs.writeFile(imagePath, base64Data, 'base64', (err) => { });
					data.image = imageName;
					if(mediaConfig.cloud_upload_enabled == 'true') {
						aliOssHelper.uploadFileStream(imageName,imagePath);
					}
				}
			}
			if (data.image != null || data.message != '') {
				var receiveUser = await User.findOne({ "client_user_id": data.receiverId });
				let readStatus = messageStatusConfig.seen;

				if (receiveUser.chatTo != socket.userId) {
					if (receiveUser.socket_id != null) {
						readStatus = messageStatusConfig.delivered;
					}
					else {
						readStatus = messageStatusConfig.sent;
					}
				}

				var chatMessage = await messageController.storeMessage(data, readStatus);

				if (receiveUser.socket_id) {
					var topicPrefix = dynamicTopic(chatMessage.senderId, chatMessage.receiverId);
					socket.broadcast.to(receiveUser.socket_id).emit(topicPrefix + '-message-received', chatMessage);
					var messageReceived = await messageController.getMessageForConversationList(chatMessage);
					socket.broadcast.to(receiveUser.socket_id).emit('message-received', messageReceived);
				}

				callback(chatMessage);
			}
			else {
				callback(null);
			}
		});

		socket.on('typing', (data) => {
			data.senderId = socket.userId;
			User.findOne({ "client_user_id": data.receiverId, "socket_id": { $ne: null } }).then(user => {
				var topicPrefix = dynamicTopic(data.senderId, data.receiverId);
				if (user) {
					socket.broadcast.to(user.socket_id).emit(topicPrefix + '-display', data);
				}
			});
		});

		socket.on('disconnect', () => {
			updateAndNotify(socket, false);
		});

		socket.on('leave-chatroom', (data) => {
			User.updateOne(
				{ "client_user_id": socket.userId },
				{ $set: { "chatTo": null } }
			).exec();
		});

		socket.on('init-chat', async (data, callback) => {
			data.senderId = socket.userId;
			var sendUser = await User.findOneAndUpdate(
				{ "client_user_id": data.senderId },
				{ $set: { "chatTo": data.receiverId } }
			);

			var receivedUser = await User.findOne(
				{ "client_user_id": data.receiverId }
			);

			var conversation = await conversationController.checkConversation({ "receiverId": data.receiverId, "senderId": data.senderId });
			if (conversation) {
				messageController.updateSeenStatus(conversation._id,socket.userId);
			}
			callback({
				"lastActiveAt": receivedUser ? dateHelper.getStandardFormat(receivedUser.lastActiveAt) : null,
				"isFirstTime": conversation && conversation.last_message_id ? false : true,
				"isBlock": conversation && conversation.blockBy ? true : false,
				"blockBy": conversation && conversation.blockBy ? conversation.blockBy : null,
			});
		});

		socket.on('remove-message', async (data, callback) => {

			var message = await Message.findOne({ "_id": data.messageId });

			var removedMsg = await messageController.removedMessage(message);

			var user = await User.findOne({ "client_user_id": data.receiverId });

			if (user && user.socket_id) {
				var topicPrefix = dynamicTopic(socket.userId, data.receiverId);
				socket.broadcast.to(user.socket_id).emit(topicPrefix + '-message-removed', { 'messageId': data.messageId });
			}

			callback({
				"message": removedMsg ? "fail" : "success"
			});
		});

		socket.on('block-user', async (data, callback) => {

			var blockTo = await blockController.blockTo(data, socket.userId);

			var topicPrefix = dynamicTopic(socket.userId, data.blockTo);


			var blockToUser = await User.findOne({ "client_user_id": data.blockTo });

			socket.broadcast.to(blockToUser.socket_id).emit(topicPrefix + '-block-unblock', { "status": true });

			callback({
				"message": blockTo ? "success" : "fail"
			});
		});

		socket.on("unblock-user", async (data, callback) => {

			var unBlockTo = await blockController.unBlockTo(data, socket.userId);
			var topicPrefix = dynamicTopic(socket.userId, data.unBlockTo);

			var unBlockToUser = await User.findOne({ "client_user_id": data.unBlockTo });
			if (unBlockTo != null) {
				socket.broadcast.to(unBlockToUser.socket_id).emit(topicPrefix + '-block-unblock', { "status": false });
			}
			callback({
				"message": unBlockTo != null ? "success" : "fail"
			});
		});
	});
}

module.exports = sockets;