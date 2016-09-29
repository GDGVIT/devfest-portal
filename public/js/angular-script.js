var app = angular.module('app',["ngRoute"]);
var scope;

app.controller("controller",function($scope){

});

app.controller('mainController',function($scope){
});

app.controller("createController",function($scope,$http,$location){
    $scope.teamName = user.name + "'s Team";
    $scope.requesting = false;
    $scope.createTeam = function () {
        $scope.requesting = true;
        $http({
            method: 'POST',
            url: '/team/create',
            data : {
                name : $scope.teamName
            }
        }).then(function successCallback(response) {
            $scope.requesting = false;
            if(response.data.success){
                Materialize.toast("Team created",4000);
                $location.path("team");
            }else{
                Materialize.toast(response.data.message,4000);
            }
        }, function errorCallback(response) {
            $scope.requesting = false;
            Materialize.toast("Internal Server Error",4000);
        });
    }
});

app.controller('teamController',function($scope,$http){
    $scope.team = team;
    $scope.requesting = false;
    $scope.deleteTeam = function(){
        $scope.requesting = true;
        console.log("deleting team");
        $http({
            method: 'POST',
            url: '/team/delete'
        }).then(function successCallback(response) {
            $scope.requesting = false;
            if(response.data.success){
                Materialize.toast("Team deleted",4000);
            }else{
                Materialize.toast(response.data.message,4000);
            }
        }, function errorCallback(response) {
            $scope.requesting = false;
            Materialize.toast("Internal Server Error",4000);
        });
    }
    $scope.leaveTeam = function () {

    }
});

app.config(function($routeProvider) {
  $routeProvider
      .when("/", {
        templateUrl : "profile/main",
          controller : "mainController"
      })
      .when("/create", {
        templateUrl : "profile/create",
          controller : "createController"
      })
      .when("/team", {
        templateUrl : "profile/team",
          controller : "teamController"
      });
});