var app=angular.module('app',['controllers']);
var controllers=angular.module('controllers',[]);

controllers.controller('mainController',function($scope){
  $scope.create=false;
  $scope.join=false;
  $scope.info=false;
  $scope.team=true;
});
