const User = require("../models/User");
const request = require('request');
const uaaConfig = require('../config/uaa');

const createOrGetUser = async (userId, token, socket) => {

	var user = await User.findOne({ "client_user_id": userId });

	if (user) {

		User.updateOne(
			{ "client_user_id": user.client_user_id },
			{ $set: { "socket_id": socket.id } },
		).exec();

		return user;
	}
	else {

		return request.get({
			url: uaaConfig.user_info_url + '/' + userId,
			headers: {
				"Authorization": token,
				"Accept": 'application/json'
			}
		},
			function (error, response) {
				var responseJson = JSON.parse(response.body);
				var newUser = new User({
					client_user_id: userId,
					name: responseJson.result.user.name,
					image: responseJson.result.user.image,
					socket_id: socket.id
				});

				newUser.save();
				return newUser;
			});
	}
};

exports.createOrGetUser = createOrGetUser;