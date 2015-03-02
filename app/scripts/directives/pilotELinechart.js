angular.module(
    'eu.crismaproject.pilotE.linechart.directives'
).directive(
    'pilotELinechart',
    [
        function () {
            'use strict';

            var controller, scope;

            scope = {
                worldstateId: '=',
                width: '=?',
                height: '=?'
            };

            controller = [
                '$scope',
                function ($scope) {
                    var i, start, vals1, vals2, vals3, vals4, vals5, vals6;

                    start = new Date();
                    vals1 = [];
                    vals2 = [];
                    vals3 = [];
                    vals4 = [];
                    vals5 = [];
                    vals6 = [];
                    for (i = 0; i < 20; i++) {
                        vals1.push({x: i, y: Math.round(Math.random() * 100)});
                        vals2.push({x: i, y: Math.round(Math.random() * 100)});
                        vals3.push({x: i, y: Math.round(Math.random() * 100)});
                        vals4.push({x: i, y: Math.round(Math.random() * 100)});
                        vals5.push({x: i, y: Math.round(Math.random() * 100)});
                        vals6.push({x: i, y: Math.round(Math.random() * 100)});
                    }

                    $scope.data = [{
                        'values': vals1,
                        'key': 'Vehicles (requested)'
                    }, {
                        'values': vals2,
                        'key': 'Vehicles (alarmed)'
                    }, {
                        'values': vals3,
                        'key': 'Vehicles (on the way)'
                    }, {
                        'values': vals4,
                        'key': 'Responder per Patient (requested)'
                    }, {
                        'values': vals5,
                        'key': 'Responder per Patient (alarmed)'
                    }, {
                        'values': vals6,
                        'key': 'Responder per Patient (on the way)'
                    }];

                    if (!$scope.height) {
                        $scope.height = 480;
                    }

                    $scope.xAxisTickFormatFunction = function () {
                        return function (dataitem) {
                            return dataitem + ' min';
                        };
                    };

                    $scope.yAxisTickFormatFunction = function () {
                        return function (dataitem) {
                            return dataitem;
                        };
                    };

                    $scope.xFunction = function () {
                        return function (dataitem) {
                            return dataitem.x;
                        };
                    };
                    $scope.yFunction = function () {
                        return function (dataitem) {
                            return dataitem.y;
                        };
                    };
                }
            ];

            return {
                scope: scope,
                controller: controller,
                restrict: 'E',
                templateUrl: 'templates/pilotELinechart.html'
            };
        }
    ]
);