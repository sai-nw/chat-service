(function () {
  'use strict';

  angular
    .module('app')
    .controller('MainCtrl', MainCtrl);

  MainCtrl.$inject = ['$scope', '$http', '$localStorage', '$timeout', 'socket', 'lodash', 'moment', '$interval'];

  function MainCtrl($scope, $http, $localStorage, $timeout, socket, lodash, moment, $interval) {

    $scope.message = '';
    $scope.users = [];
    $scope.messages = [];
    $scope.likes = [];
    $scope.messageCountList = [];
    $scope.unsentMessages = [];

    $scope.unreadMessages = [];
    $scope.unreadMessageCount = '';

    $scope.myId = $localStorage.userId;
    $scope.myNickname = $localStorage.userName;
    $scope.activeStatusInfo = [];

    var nickname = $scope.myNickname;
    var nextMessageId = null;
    var timeout = undefined;

    $scope.user = null;
    $scope.topic = null;
    $scope.firstConversationStatus = null;
    $scope.blockBy = '';

    const changeDate = (data) => {
      if (data.lastActiveAt != null) {
        var date1 = moment(data.lastActiveAt, 'YYYY-MM-DD hh:mm:ss'),

          date2 = moment(new Date()).format('YYYY-MM-DD hh:mm:ss');

        var duration = moment.duration(moment(date2, 'YYYY-MM-DD hh:mm:ss').diff(date1));

        var minutes = duration.asMinutes().toFixed(0);
        var hours = duration.asHours().toFixed(0);
        var days = duration.asDays().toFixed(0);

        data.minutes = minutes;
        data.hours = hours;
        data.days = days;
      }
      $scope.activeStatusInfo = data;
    }

    socket.emit('get-users', null, function (data) {
      $scope.messageCountList = [];
      $scope.users = data.filter(function (item) {
        if (item.client_user_id !== $scope.myId) {
          return true;
        }
      });
    });

    $scope.uploadedFile = function (element) {

      $scope.currentFile = element.files[0];
      var reader = new FileReader();
      reader.onload = function (event) {
        $scope.image_source = event.target.result
        $scope.$apply(function ($scope) {
          $scope.files = element.files;
        });
      }
      reader.readAsDataURL(element.files[0]);
    };

    $scope.checkTo = function (user) {
      if (user) {
        $scope.user = user;
        $scope.receiverId = user.client_user_id;
        $scope.receiverName = user.name;
        $scope.receiverSocketId = user.socket_id;
      }
      $scope.messages = [];
      if ($scope.topic) {
        socket.off($scope.topic + "-display");
        socket.off($scope.topic + '-message-received');
        socket.off($scope.topic + "-show-active-status");
        socket.off($scope.topic + "-block-unblock");
        socket.off($scope.topic + "-message-removed");
      }
      if ($scope.myId > $scope.receiverId) {
        $scope.topic = $scope.myId + "-" + $scope.receiverId;
      }
      else {
        $scope.topic = $scope.receiverId + "-" + $scope.myId;
      }

      socket.emit('init-chat', { "receiverId": $scope.receiverId }, function (data) {

        socket.emit('leave-chatroom');

        $scope.firstConversationStatus = {
          firstConversationStatus: data.isFirstTime,
          blockStatus: data.isBlock,
          blockBy: data.blockBy
        }
        return changeDate(data);
      });

      socket.on($scope.topic + "-show-active-status", (data) => {
        return changeDate(data);
      });

      socket.on("message-received", (data) => {
        console.log(data);
      });

      socket.emit('get-messages', { "nextMessageId": 0, 'receiverId': $scope.receiverId }, function (responseData) {

        $.each(responseData.messages, function (index, item) {
          $scope.messages.unshift(item);
        });
        
        nextMessageId = responseData.nextMessageId;

      });

      socket.on($scope.topic + '-message-received', function (data) {
        $scope.messages.push(data);
        $scope.firstConversationStatus.firstConversationStatus = false;
        socket.emit('get-users');
      });

      socket.on($scope.topic + "-" + "display", (data) => {
        if (data.typing == true)
          $('.typing').text(`${data.user} is typing...`)
        else
          $('.typing').text("")
      });

      socket.on($scope.topic + '-message-removed', function (data) {
        $scope.messages.forEach(function (m){
          if(m.id === data.messageId){
            m.removedStatus = true;
          }
        });
      });

      socket.on($scope.topic + '-block-unblock', function (data) {

        $scope.firstConversationStatus.blockStatus = data.status;

      });


    }

    $scope.loadMore = function () {

      socket.emit('get-messages', { 'nextMessageId': nextMessageId, 'receiverId': $scope.receiverId }, function (responseData) {

        $.each(responseData.messages, function (index, item) {

          $scope.messages.unshift(item);

        })
        nextMessageId = responseData.nextMessageId;
      });
    }

    $scope.sendMessage = function (message) {

      var newMessage = {
        image: $scope.image_source,
        message: message ? message : $scope.message,
        receiverId: $scope.receiverId
      }
      if (socket.status() == true) {

        socket.emit('send-message', newMessage, (responseData) => {
          if (responseData) {
            $scope.firstConversationStatus.firstConversationStatus = false;
            $scope.unsentMessages.pop();
            $scope.messages.push({
              id: responseData.id,
              sent: true,
              image: responseData.image,
              message: responseData.message,
              receiverId: responseData.receiverId,
              senderId: responseData.senderId,
              messageAt: responseData.messageAt,
            });
          }
        });
      }
      else {
        $scope.unsentMessages.push(newMessage);
        $scope.messages.push({
          sent: false,
          image: newMessage.image,
          message: newMessage.message,
          receiverId: newMessage.receiverId
        });
      }

      $scope.message = '';
      angular.element("input[type='file']").val(null);
      $scope.image_source = null;
    };

    $scope.removedMessage = function (message) {
      socket.emit('remove-message', { messageId: message.id, receiverId: $scope.receiverId }, function (response) {
        if (response.message == "success") {
          $scope.messages.forEach(function (m){
            if(m.id === message.id){
              m.removedStatus = true;
            }
          });
        }
      });
    }
    
    $scope.blockTo = function () {
      socket.emit('block-user', { blockTo: $scope.receiverId }, function (response) {
        if (response.message == "success") {

          $scope.firstConversationStatus.blockStatus = true;
          $scope.firstConversationStatus.blockBy = $scope.myId;
        }

      });
    };

    $scope.unBlockTo = function () {
      socket.emit('unblock-user', { unBlockTo: $scope.receiverId }, function (response) {
        if (response.message == "success") {
          $scope.firstConversationStatus.blockStatus = false;
          $scope.firstConversationStatus.blockBy = $scope.myId;
        }
      });
    };

    $scope.keyPress = function (e) {
      if (e.which != 13) {
        socket.emit('typing', { user: $scope.myNickname, typing: true, receiverId: $scope.receiverId })
        clearTimeout(timeout)
        timeout = setTimeout(typingTimeout, 3000)
      } else {
        clearTimeout(timeout)
        typingTimeout()
      }
    };

    function typingTimeout() {
      socket.emit('typing', { user: $scope.myNickname, typing: false, receiverId: $scope.receiverId })
    }


    socket.on('connect', function () {

      $scope.checkTo($scope.user);

      if (socket.status() == true) {
        $scope.unsentMessages.forEach(function (item) {

          socket.emit('send-message', item, (responseData) => {

            if (responseData.status == true) {
              $scope.unsentMessages.pop();
            }
          });
        });
      }
    });

    $scope.counter = 200;
    var intervalId;

    $scope.startAutoSend = () => {
      console.log("Started Auto Sending Message");
      if ( angular.isDefined(intervalId) ) return;

      intervalId = $interval(function() {
        if ($scope.counter > 0) {
          $scope.sendMessage($scope.counter);
          $scope.counter -= 1;
        }
        else{
          $scope.stopAutoSend();
        }
      }, 50);

    };

    $scope.stopAutoSend = () => {
      console.log("Stopped Auto Sending Message");
      if (angular.isDefined(intervalId)) {
        $interval.cancel(intervalId);
        intervalId = undefined;
      }
    };

    $scope.resetAutoSendCounter = function() {
      $scope.counter = 200;
    };

  };
})();