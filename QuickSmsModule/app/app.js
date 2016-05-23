'use strict';

// Declare app level module which depends on views, and components
angular.module('mainApp', [
    'ngRoute',
    'quickSms'
]).config(['$routeProvider', 'ktSendSmsProvider', function ($routeProvider, ktSendSmsProvider) {
    $routeProvider.otherwise({redirectTo: '/'});

    ktSendSmsProvider.apiUrl('/rest.apifon.com/');
    ktSendSmsProvider.senderID('apifon'); // Here we set a default value - it can be overwritten by a controller variable

}])
    .controller('indexCtrl', indexCtrl);

indexCtrl.$inject = ['$scope'];

function indexCtrl($scope) {
    $scope.configSendSms  = {
        validityPeriod: 5,
        maxSms: 5
    };
}

