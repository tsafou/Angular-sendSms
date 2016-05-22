angular.module('quickSms', ['ngMaterial', 'ngMessages'])
    .controller('quickSmsController', quickSmsController)
    .controller('smsTextareaController', smsTextareaController)
    .directive('sendSms', sendSmsDirective)
    .directive('afSenderid', afSenderidDirective)
    .directive('afSmsTextarea', smsTextareaDirective)
    .service('smsEncodingService', smsEncodingService)
    .provider('ktSendSms', ktSendSmsProvider);

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

function ktSendSmsProvider() {
    var url = false;
    var senderID = false;
    var config = {
        validityPeriod: 8,
        encoding: 'default',
        maxSms: 5
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
                    //console.log('Provider sendSms to url: ', url, ' with senderID: ', from, 'to number ', countryCode, '-', to, 'and message: ', text);

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




function smsEncodingService() {

    var possibleEncodings = [
        {
            id: '7-bit',
            name: ['default alphabet', 'US-ASCII'],
            totalChars: 160,
            splitterLength: 153
        },
        {
            id: '8-bit',
            name: ['Latin-1 ISO-8859-1', 'Binary', 'Cyrillic ISO-8859-5', 'Hebrew ISO-8859-8'],
            totalChars: 140,
            splitterLength: 134
        },
        {
            id: '16-bit',
            name: ['UTF-16'],
            totalChars: 70,
            splitterLength: 67
        }
    ];

    function getEncodings(encodingName) {
        if (encodingName == undefined) {
            return possibleEncodings;
        }

        for (var i = 0; i < possibleEncodings.length; i++) {
            if (possibleEncodings[i].name.indexOf(encodingName) > -1) {
                return {
                    name: encodingName,
                    totalChars: possibleEncodings[i].totalChars,
                    splitterLength: possibleEncodings[i].splitterLength
                }
            }
        }
    }

    return {
        getEncodings: getEncodings
    }
}

smsTextareaController.$inject = ['$scope', 'smsEncodingService'];

function smsTextareaController($scope, smsEncodingService) {

    $scope.textInvalid = false;
    $scope.showLengthError = false;
    $scope.textLength = 0;
    $scope.smsCount = 0;

    $scope.possibleEncodings = smsEncodingService.getEncodings();
    $scope.encoding = smsEncodingService.getEncodings('default alphabet');

    $scope.remainingChars = $scope.encoding.totalChars;

    // if encoding changes, redo the calculations
    $scope.$watch('endcodingName', function (newVal) {
        if (newVal==undefined) return;
        $scope.encoding = smsEncodingService.getEncodings(newVal);
        calcSmsCount();
    });



    // Get special fields from account
    $scope.fields = ['firstName'];  //contactType; // Bind this with the account's special fields - how to get this?

    $scope.$watch('message', function (newVal, oldVal) {
        if (newVal == oldVal) return;

        if (newVal == undefined) {
            $scope.textLength = 0;
            calcSmsCount();
            return;
        }

        $scope.textDirty = true; // after that show ng-messages

        var totalFieldsLength = 0;
        var cleanString = $scope.message; //get copy of text
        var reg = /{(.*?)}/g; //match all text between { and }
        var matches = [], found;

        while (found = reg.exec(newVal)) {
            var position=0;
            for (var char in found[0]) {
                if (found[0][char] == '{')
                    position++;
            }
            found[0] = found[0].replace(/{/g, '');
            found[0] = found[0].replace(/}/g, '');
            if (found[0].length > 0)
                matches.push(found[0]);
            reg.lastIndex = found.index + position; // to catch the case of multiple {{{ followed by specialField i.e. {{{firstName}
        }

        // Loop through detected special fields and try to match them with the account fields array
        // If successful get the maxLength of the field and replace in text length
        for (var j = 0; j < matches.length; j++) {
            for (var k = 0; k < $scope.fields.length; k++) {
                if ($scope.fields[k].fieldName == matches[j]) {
                    totalFieldsLength += $scope.fields[k].maxLength;
                    cleanString = cleanString.replace("{" + $scope.fields[k].fieldName + "}", "");
                }
            }
        }
        cleanString = cleanString.replace(/(\u000c|\u005e|\u007b|\u007d|\\|\u005b|\u007e|\u005d|\u007c|\u20ac)/gi, 'az');
        $scope.textLength = cleanString.length + totalFieldsLength;
        //console.log('clean text length::', $scope.textLength);
        calcSmsCount();

    });

    function calcSmsCount() {
        if ($scope.textLength > $scope.encoding.totalChars) {
            $scope.smsCount = Math.ceil($scope.textLength / $scope.encoding.splitterLength);
            $scope.smsLength = ($scope.textLength - 1) % $scope.encoding.splitterLength;
            $scope.remainingChars = ($scope.encoding.splitterLength - 1) - $scope.smsLength;
        }
        else {
            $scope.smsCount = Math.ceil($scope.textLength / $scope.encoding.totalChars);
            $scope.smsLength = ($scope.textLength - 1) % $scope.encoding.totalChars;
            $scope.remainingChars = ($scope.encoding.totalChars - 1) - $scope.smsLength;
        }

        $scope.textInvalid = false;
        $scope.showLengthError = false;
        $scope.smsForm.message.$setValidity("tooLong", true);

        if ($scope.textDirty && $scope.smsCount > 1 && $scope.textLength > $scope.encoding.splitterLength*$scope.config.maxSms) {
            $scope.textInvalid = true;
            $scope.showLengthError = true;
            // Set form invalid
            $scope.smsForm.message.$setValidity("tooLong", false);
        }
    }

    function isEmpty(object) {
        for (var key in object) {
            if (object.hasOwnProperty(key)) {
                return false;
            }
        }
        return true;
    }

    $scope.$watch('Sms.$error', function(newVal, oldVal) {
        $scope.errors = newVal;
    });

}

function smsTextareaDirective() {

    return {
        restrict: 'E',
        controller: 'smsTextareaController',
        templateUrl: 'bower_components/quick-sms/af.smsTextarea.html',
        scope: false
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