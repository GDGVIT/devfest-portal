var app = angular.module('app',["ngRoute",'angularSpinner']);
var scope;

    app.config(function ($httpProvider) {
        $httpProvider.interceptors.push('myHttpInterceptor');
    });

    app.factory('myHttpInterceptor', function ($q, $window, usSpinnerService) {
        return {
           request: function(config) {
               usSpinnerService.spin('spinner-1');
               scope.loading = true;
             return config;
           },
           response: function(res) {
               scope.loading = false;
               usSpinnerService.stop('spinner-1');
             return res;
           }
       };
    });

app.controller("controller",function($scope){
    $scope.loading = false;
    scope = $scope;
    $scope.edit=true;
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
    $scope.users = users;
    $scope.requesting = false;
    $scope.isTeamAdmin = isTeamAdmin;
    $scope.searchMember = "";
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
                window.location.hash = "";
            }else{
                Materialize.toast(response.data.message,4000);
            }
        }, function errorCallback(response) {
            $scope.requesting = false;
            Materialize.toast("Internal Server Error",4000);
        });
    }
    $scope.leaveTeam = function () {
        $scope.requesting = true;
        console.log("leaving team");
        $http({
            method: 'POST',
            url: '/team/leave'
        }).then(function successCallback(response) {
            $scope.requesting = false;
            if(response.data.success){
                Materialize.toast("Team left",4000);
                window.location.hash = "";
            }else{
                Materialize.toast(response.data.message,4000);
            }
        }, function errorCallback(response) {
            $scope.requesting = false;
            Materialize.toast("Internal Server Error",4000);
        });
    }
    $scope.invite = function(user){
        $scope.requesting = true;
        console.log("Inviting user");
        $http({
            method: 'POST',
            url: '/team/invite',
            data : {
                userId : user._id
            }
        }).then(function successCallback(response) {
            $scope.requesting = false;
            if(response.data.success){
                Materialize.toast("Invitaion sent",4000);
                team.members.push({
                    user : user,
                    status : "invited"
                });
            }else{
                Materialize.toast(response.data.message,4000);
            }
        }, function errorCallback(response) {
            $scope.requesting = false;
            Materialize.toast("Internal Server Error",4000);
        });
    }
    $scope.removeMember = function(user){
        $scope.requesting = true;
        console.log("Removing user");
        $http({
            method: 'POST',
            url: '/team/removeMember',
            data : {
                userId : user._id
            }
        }).then(function successCallback(response) {
            $scope.requesting = false;
            if(response.data.success){
                Materialize.toast("Member removed",4000);
                team.members.splice(team.members.indexOf(user),1);
            }else{
                Materialize.toast(response.data.message,4000);
            }
        }, function errorCallback(response) {
            $scope.requesting = false;
            Materialize.toast("Internal Server Error",4000);
        });
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

app.filter('invitationFilter',function () {
    return function (input) {
        var out = [];
        angular.forEach(input, function (user) {
            for(var i in team.members){
                if(team.members[i].user._id == user._id)return;
            }
            out.push(user);
        });
        return out;
    }
});
