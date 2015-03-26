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
                'ICMM_API',
                '$resource',
                '$q',
                function ($scope, ICMM_API, $resource, $q) {
                    var all, i, start, vrequests, vals2, vals3, vals4, vals5, vals6, setValues;
                    
                    // we simply assume same repo for all ws thus read everything in one single operation instead of
                    // per dataitem, etc
                    setValues = function () {
                        var res;
                        
                        res = $resource(ICMM_API + '/CRISMA.worldstates/' + $scope.worldstateId + '?deduplicate=true&omitNullValues=false');
                        
                        res.get({}, function(ws) {
                            var createWsChain, incidentAreaWkt, ooiRes, ooiWsChain, vehicleRequestEntities;
                            
                            // hardcoded repo
                            ooiRes = $resource('https://crisma-pilote.ait.ac.at/api/entity?wsId=:wsId');
                            
                            createWsChain = function (curWs, chain) {
                                if(curWs.parentworldstate !== null) {
                                    createWsChain(curWs.parentworldstate, chain);
                                }
                                
                                curWs.worldstatedata.some(function(di) {
                                    var ai, dai;
                                    // assume ooiwsr slot has id 1
                                    if(di.datadescriptor.id === 1 || di.datadescriptor.$ref.indexOf('/CRISMA.datadescriptors/1') === 0) {
                                        // assume all use same ooi repo
                                        ai = JSON.parse(di.actualaccessinfo);
                                        chain.push(ai.id);
                                        
                                        return true;
                                    }
                                    
                                    return false;
                                });
                            };
                            
                            ooiWsChain = [];
                            
                            createWsChain(ws, ooiWsChain);
                            
                            vrequests.splice(0, vrequests.length);
                            incidentAreaWkt = null;
                            all = [];
                            ooiWsChain.forEach(function(wsId) {
                                var p;
                                p = ooiRes.query({wsId: wsId}).$promise;
                                all.push(p); 
                                p.then(function(entities) {
                                    // vehicle request is static data
                                    // hardcoded type ids
                                    entities.forEach(function (entity) {
                                        if(entity.entityTypeId === 40 && wsId === ooiWsChain[0]) {
                                            // assume 40 === vehicle request
                                            var obj = {x: 0, y: 0};
                                            entity.entityInstancesProperties.forEach(function (p) {
                                                if(p.entityTypePropertyId === 2) {
                                                    obj.x = parseInt(p.entityPropertyValue);
                                                } else if (p.entityTypePropertyId >= 3 && p.entityTypePropertyId <= 9) {
                                                    obj.y += parseInt(p.entityPropertyValue);
                                                }
                                            });
                                            var found = vrequests.some(function(vr) {
                                                if(vr.x === obj.x) {
                                                    vr.y += obj.y;
                                                    
                                                    return true;
                                                }
                                                
                                                return false;
                                            });
                                            if(!found)
                                                vrequests.push(obj);
                                        } else if(entity.entityTypeId === 14 && wsId === ooiWsChain[0] &&
                                                entity.entityName === 'Incident Area') {
                                            // assume 14 === area
                                            entity.entityInstancesProperties.some(function(p) {
                                                if(p.entityTypePropertyId === 544) {
                                                    incidentAreaWkt = p.entityPropertyValue;
                                                }
                                            });
                                        }

                                    });
                                });
                            });
                            
                            $q.all(all).then(function(res) {
                                vrequests.sort(function(a, b) {
                                    return a.x - b.x;
                                });
                           });
                        });
                    };
                    
                    start = new Date();
                    vrequests = [];
                    vals2 = [];
                    vals3 = [];
                    vals4 = [];
                    vals5 = [];
                    vals6 = [];
                    for (i = 0; i < 20; i++) {
//                        vrequests.push({x: i, y: Math.round(Math.random() * 100)});
                        vals2.push({x: i, y: Math.round(Math.random() * 100)});
                        vals3.push({x: i, y: Math.round(Math.random() * 100)});
                        vals4.push({x: i, y: Math.round(Math.random() * 100)});
                        vals5.push({x: i, y: Math.round(Math.random() * 100)});
                        vals6.push({x: i, y: Math.round(Math.random() * 100)});
                    }

                    $scope.data = [{
                        'values': vrequests,
                        'key': 'Vehicles (requested)'
//                    }, {
//                        'values': vals2,
//                        'key': 'Vehicles (alarmed)'
//                    }, {
//                        'values': vals3,
//                        'key': 'Vehicles (on the way)'
//                    }, {
//                        'values': vals4,
//                        'key': 'Responder per Patient (requested)'
//                    }, {
//                        'values': vals5,
//                        'key': 'Responder per Patient (alarmed)'
//                    }, {
//                        'values': vals6,
//                        'key': 'Responder per Patient (on the way)'
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
                    
                    $scope.$watch('worldstateId', function (n, o) {
                        if(n) {
                            setValues();
                        }
                    });
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