angular.module('quickSms', ['ngMessages'])
    .controller('quickSmsController', quickSmsController)
    .directive('sendSms', sendSmsDirective)
    .directive('afSenderid', afSenderidDirective)
    .provider('ktSendSms', ktSendSms);

quickSmsController.$inject = ['$scope', 'ktSendSms'];
sendSmsDirective.$inject = [];
afSenderidDirective.$inject = [];

function quickSmsController($scope, ktSendSms) {
    $scope.senderID = ktSendSms.getSenderID();

    $scope.config = ($scope.config != undefined) ? angular.extend(ktSendSms.getConfig(), $scope.config) : ktSendSms.getConfig();

    ktSendSms.getCountyCodes().then(function (response) {
        $scope.countryCodesObj = response.data;
    });

    $scope.send = function (message) {
        ktSendSms.sendSms(
            {
                config: $scope.config,
                message: message,
                from: $scope.senderID,
                to: $scope.recipient,
                countryCode: $scope.countryCode
            }
        );
    };
}

function ktSendSms() {
    var url = false;
    var senderID = false;
    var config = {
        validityPeriod: 8,
        encoding: 'default'
    };

    this.apiUrl = function (_url) {
        url = _url || url;
    };

    this.senderID = function (_senderID) {
        senderID = _senderID || _senderID;
    };


    this.$get = ['$http',
        function ($http) {
            return {
                /**
                 * Send request to server with email data
                 * @data {Object}
                 *  - message - text message that user sends (required)
                 *  - from - it can be any user identifier (optional, this can be handled on server)
                 */

                getCountyCodes: function () {
                    var url = 'bower_components/quick-sms/countryCodes.json';
                    return $http({
                        method: 'GET',
                        url: url,
                        headers: {'Content-Type': 'application/json'}
                    })
                },

                getSenderID: function () {
                    return senderID;
                },

                getConfig: function () {
                    console.log('get config runs', config);
                    return config;
                },

                sendSms: function (data) {
                    var config = data.config;
                    var from = data.from;
                    var to = data.to;
                    var text = data.message;
                    var countryCode = data.countryCode.split('(+')[1].replace(/\)/g, '');

                    console.log('config is: ', config);
                    console.log('Provider sendSms to url: ', url, ' with senderID: ', from, 'to number ', countryCode, '-', to, 'and message: ', text);

                    if (!url) {
                        throw new Error('Please setup feedback API uri with "ktSendSmsProvider"');
                    }
                    if (!data || typeof data !== 'object') {
                        throw new Error('Data object is required');
                    }
                    if (!text || typeof text !== 'string') {
                        throw new Error('Message string is required');
                    }
                    if (!to || typeof(to) !== 'number') {
                        throw new Error('Recipient number is required');
                    }

                    return this._makeRequest(data);
                },

                _makeRequest: function (data) {
                    return $http({
                        method: 'POST',
                        url: url,
                        data: data,
                        headers: {'Content-Type': 'application/json'}
                    }).then(function (response) {
                        console.log('Message has been sent!');
                    }, function (error) {
                        console.log('error - sms not sent. error:: ', error.statusText);
                    });
                }
            };
        }
    ];
}

function sendSmsDirective() {

    return {
        restrict: 'EA',
        replace: true,
        controller: 'quickSmsController',
        templateUrl: 'bower_components/quick-sms/indexQuick.html', //templateCache / const var path or ???
        // templateUrl: 'indexQuick.html',
//         ...
//         template: [
//         '<div>',
//         '<p>This is a p block within the div</p>',
//         '</div>'
//     ].join(''),
// ...
        scope: {
            width: '@?', // if no width is specified it takes 100% of parent
            senderID: '@senderId',
            config: '=?'
        },
        link: function ($scope, element, attributes) {
            element.css("width", $scope.width);
        }
    };
}

function afSenderidDirective() {
    return {
        require: 'ngModel',
        link: function (scope, element, attr, ngModelCtrl) {

            function checkValid(ti) {

                return !(
                    !ti ||
                    ti.length > 16 ||
                    ((/[+]/g).test(ti) && ((ti.match((/[+]/g)).length > 1 || ti.indexOf('+') > 0) && ti.length > 11)) ||
                    ((/[a-zA-Z!.@#$_+-]/g).test(ti) && (/[0-9]/g).test(ti) && ti.length > 11) ||
                    (/[^0-9a-zA-Z!.@#$_+-]/g).test(ti)
                );
            }

            ngModelCtrl.$validators.validCharacters = function (modelValue, viewValue) {
                if (modelValue == undefined && viewValue == undefined || modelValue.length < 1 && viewValue.length < 1) return;
                var value = modelValue || viewValue;
                return checkValid(value);
            }
        }
    };
}


// angular.module('quickSms').run(['$templateCache', function($templateCache) {
//     'use strict';
//
//     $templateCache.put('indexQuick.html',
//         "<p>Works</p>"
//     );
//
// }]);


// scope: {
//     text: '=textModel', // the ng-model
//         userOptions: '@textOptions', // obj with options ie if should detect special fields
//         userEncoding: '=textEncoding', // if you wish to overwrite default encoding (max chars etc depend on that)
//         smsCount: '=?textSmscount', // Use the '?' to show that this field is optional
//         maxSms: '=?textMaxsms',
//         Sms: '=?textForm', // name of the form that this text area is part of
//         required: '=?', // if field should be required - default is true
//         errors: '=?', // object to pass errors to
//         width: '=?'
// },