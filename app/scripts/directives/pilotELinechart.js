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
                    var  i, setValues, vRequests, vOnSite, vOnTheWay, vAlarmed, vals5, vals6;
                    
                    // we simply assume same repo for all ws thus read everything in one single operation instead of
                    // per dataitem, etc
                    setValues = function () {
                        var res, allEntities, allOoiWs, ooiWs, t0 ;
                        
                        res = $resource(ICMM_API + '/CRISMA.worldstates/' + $scope.worldstateId + '?deduplicate=true&omitNullValues=false');
                        
                        res.get({}, function(ws) {
                            var createWsChain, incidentAreaWkt, ooiEntityRes, ooiWsChain, ooiWsRes, vehicleRequestEntities;
                            
                            // hardcoded repo
                            ooiEntityRes = $resource('https://crisma-pilote.ait.ac.at/api/entity?wsId=:wsId');
                            ooiWsRes = $resource('https://crisma-pilote.ait.ac.at/api/worldstate/:wsId');
                            
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
                            
                            vRequests.splice(0, vRequests.length);
                            incidentAreaWkt = null;
                            allEntities = [];
                            allOoiWs = [];
                            ooiWsChain.forEach(function(wsId) {
                                var p;
                                
                                p = ooiWsRes.get({wsId: wsId}).$promise;
                                allOoiWs.push(p);
                            });
                            
                            $q.all(allOoiWs).then(function(ws) {
                                ooiWs = ws;
                                
                                ooiWsChain.forEach(function(wsId) {
                                    var p;
                                    p = ooiEntityRes.query({wsId: wsId}).$promise;
                                    allEntities.push(p); 
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
                                                var found = vRequests.some(function(vr) {
                                                    if(vr.x === obj.x) {
                                                        vr.y += obj.y;

                                                        return true;
                                                    }

                                                    return false;
                                                });
                                                if(!found)
                                                    vRequests.push(obj);
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

                                $q.all(allEntities).then(function(res) {
                                    var incidentPolygon;
                                    
                                    incidentPolygon = new Terraformer.Polygon(Terraformer.WKT.parse(incidentAreaWkt));
                                    
                                    vRequests.sort(function(a, b) {
                                        return a.x - b.x;
                                    });
                                    
                                    
                                    res.forEach(function (entities) {
                                        var onSiteCount, alarmedCount, onTheWayCount;
                                        
                                        onSiteCount = alarmedCount = onTheWayCount = 0;
                                        
                                        // the entities should be sorted like the ws chain, t(0) to t(n)
                                        entities.forEach(function (entity) {
                                            var entityPos;
                                            if(entity.entityTypeId === 7) {
                                                // assume 7 === vehicle
                                                
                                                if(entity.entityInstancesGeometry &&
                                                        entity.entityInstancesGeometry[0] &&
                                                        entity.entityInstancesGeometry[0].geometry &&
                                                        entity.entityInstancesGeometry[0].geometry.geometry &&
                                                        entity.entityInstancesGeometry[0].geometry.geometry.wellKnownText) {
                                                    entityPos = Terraformer.WKT.parse(entity.entityInstancesGeometry[0].geometry.geometry.wellKnownText);
                                                }
                                                
                                                if(entityPos && Terraformer.Tools.polygonContainsPoint(incidentPolygon, entityPos.coordinates)) {
                                                    // vehicle on site
                                                    onSiteCount++;
                                                } else {
                                                    // not on site
                                                    entity.entityInstancesProperties.forEach(function(p) {
                                                        if (p.entityTypePropertyId === 1000) {
                                                            // assume resource command
                                                        }
                                                    });
                                                }
                                            }
                                        });
                                    });
                               });
                            });
                        });
                    };
                    
                    vRequests = [];
                    vOnSite = [];
                    vOnTheWay = [];
                    vAlarmed = [];
//                    for (i = 0; i < 20; i++) {
//                        vrequests.push({x: i, y: Math.round(Math.random() * 100)});
//                        vOnSite.push({x: i, y: Math.round(Math.random() * 100)});
//                        vOnTheWay.push({x: i, y: Math.round(Math.random() * 100)});
//                        vAlarmed.push({x: i, y: Math.round(Math.random() * 100)});
//                    }

                    $scope.data = [{
                        'values': vRequests,
                        'key': 'Vehicles (requested)'
                    }, {
                        'values': vAlarmed,
                        'key': 'Vehicles (alarmed)'
                    }, {
                        'values': vOnTheWay,
                        'key': 'Vehicles (on the way)'
                    }, {
                        'values': vOnSite,
                        'key': 'Vehicles (on site)'
//                    },
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