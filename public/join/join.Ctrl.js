(function () {
  'use strict';

  angular
    .module('app')
    .controller('JoinCtrl', JoinCtrl);

  JoinCtrl.$inject = ['$location', '$http', '$scope', '$localStorage', 'socket'];

  function JoinCtrl($location, $http, $scope, $localStorage, socket) {

    $scope.token = '';
    var token;

    $scope.join = function () {

      token = $scope.token;

      socket.connect({ data: token });

      socket.on('connect', function () {

        socket.on('access', (response) => {

          $localStorage.userId = response.userId;
          $localStorage.userName = response.userName;
          $location.path('/main');

        });
      });
    }
  }
})();