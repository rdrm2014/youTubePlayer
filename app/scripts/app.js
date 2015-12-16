/**
 * Created by ricardomendes on 15/12/15.
 */
var app = angular.module('Yt', []);

var atom = {
    remote: require('remote')
};
var notifier = atom.remote.require('node-notifier');

// Youtube API
var player;
function onYouTubePlayerAPIReady() {
    player = new YT.Player('myytplayer', {
        events: {
            'onReady': function () {
                console.log("onYouTubePlayerReady");
                angular.element(document.getElementById('AppCtrl')).scope().stopLoader();
            },
            'onApiChange': function () {
                angular.element(document.getElementById('AppCtrl')).scope().stopLoader();
            },
            'onStateChange': function (event) {
                console.log("Player's new state: ", event);

                if (event.data == YT.PlayerState.CUED) {
                    console.log("CUED");
                }

                if (event.data == YT.PlayerState.ENDED) {
                    console.log("next");
                    angular.element(document.getElementById('AppCtrl')).scope().launchNext();
                }

            }
        }
    });
}

// Drag & Drop add URL
function addNewURL(url) {
    angular.element(document.getElementById('AppCtrl')).scope().callAddURL(url);
}

// Config
app.config(function ($httpProvider) {
    delete $httpProvider.defaults.headers.common['X-Requested-With'];
});

// Directive
app.directive('youtube', function () {
    'use strict';
    return {
        scope: {
            height: "@",
            width: "@",
            videoId: "@",
            loaded: '=loaded'
        },
        restrict: 'E',
        link: function (scope, elem) {
            scope.initializing = false;

            scope.$watch('videoId', function (src) {
                if (src) {
                    if (angular.isUndefined(scope.loaded)) {
                        elem.html('<iframe id="myytplayer" type="text/html" width="' + scope.width + '" height="' + scope.height + '" src="https://www.youtube.com/embed/' + src + '?enablejsapi=1&playerapiid=ytplayer&autoplay=1" frameborder="0"></iframe>');

                        // Include API
                        var tag = document.createElement('script');
                        tag.src = "https://www.youtube.com/player_api";
                        var firstScriptTag = document.getElementsByTagName('script')[0];
                        firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

                        // No need to load API again
                        scope.loaded = true;
                    }
                    else {
                        // From now on, just use the API to load new videos
                        player.loadVideoById(src);
                    }
                }
                else {
                    elem.html('<img src="http://lorempixel.com/340/245/">');
                }
            });
        }
    };
});

// Service
app.service('VideosService', ['$window', '$rootScope', '$log', '$filter', '$sce', function ($window, $rootScope, $log, $filter, $sce) {
    var db = atom.remote.getGlobal("collection");
    console.log(db);
    var alertIcon = atom.remote.getGlobal("alertIcon");

    var youtube = {
        ready: false,
        player: null,
        playerId: null,
        videoId: null,
        videoTitle: "Uknown",
        playerHeight: '200',
        playerWidth: '340',
        apiKey: "AIzaSyDccpMR4urjtTo_U6BqSReEPFXGH2FtQvI"
    };

    var upcoming = db.items;

    this.launchPlayer = function (id, title) {

        if (typeof id === "undefined" || !id)
            return;
        youtube.videoId = id;
        youtube.videoTitle = title;

        notifier.notify({
            'title': 'Playing now',
            'message': title,
            icon: alertIcon
        });

    };

    this.launchNext = function () {
        var current = $filter('filter')(upcoming, function (d) {
            return d.id === youtube.videoId;
        })[0];
        var index = upcoming.indexOf(current);
        if (index >= 0 && index < upcoming.length - 1)
            this.launchPlayer(upcoming[index + 1].id, upcoming[index + 1].title);
        else {
            this.launchPlayer(upcoming[0].id, upcoming[0].title);
        }
    };

    this.deleteVideo = function (id) {
        var cid = db.where({id: id}).items[0].cid;
        db.remove(cid);

        for (var i = upcoming.length - 1; i >= 0; i--) {
            if (upcoming[i].id === id) {
                upcoming.splice(i, 1);
                break;
            }
        }
    };

    this.queueVideo = function (id, title) {
        db.insert({
            id: id,
            title: title
        });

        upcoming.push({
            id: id,
            title: title
        });
        return upcoming;
    };

    this.YouTubeGetID = function (url) {
        var ID = '';
        url = url.replace(/(>|<)/gi, '').split(/(vi\/|v=|\/v\/|youtu\.be\/|\/embed\/)/);
        if (url[2] !== undefined) {
            ID = url[2].split(/[^0-9a-z_\-]/i);
            ID = ID[0];
        }
        else {
            ID = url;
        }
        return ID;
    };

    this.getYoutube = function () {
        return youtube;
    };

    this.getUpcoming = function () {
        return upcoming;
    };

}]);


// Controller
app.controller('AppCtrl', function ($scope, $http, $log, VideosService) {

    init();

    $scope.loading = false;

    $scope.stopLoader = function () {
        $scope.loading = false;
        $scope.$apply();
    };

    var alertIcon = atom.remote.getGlobal("alertIcon");

    function init() {
        $scope.youtube = VideosService.getYoutube();
        $scope.upcoming = VideosService.getUpcoming();
    }

    $scope.launch = function (id, title) {
        $scope.loading = true;
        VideosService.launchPlayer(id, title);
        $log.info('Launched id:' + id + ' and title:' + title);
    };

    $scope.launchNext = function () {
        console.log("$scope.launchNext");
        VideosService.launchNext();
        $scope.$apply();
    };

    $scope.delete = function (id) {
        VideosService.deleteVideo(id);
    };

    $scope.url = "";

    $scope.addURL = function () {
        var videoId = VideosService.YouTubeGetID($scope.url);
        $http.get("https://www.googleapis.com/youtube/v3/videos?part=snippet&id=" + videoId + "&key=" + $scope.youtube.apiKey).success(function (data) {
            VideosService.queueVideo(videoId, data.items[0].snippet.title);
            $log.info('Queued id:' + videoId + ' and title:' + data.items[0].snippet.title);
            console.log(data);

            notifier.notify({
                'title': 'New URL',
                'message': $scope.url,
                icon: alertIcon
            });

            $scope.url = "";

        }).error(function () {
            $log.info('Search error');
        });
    };

    $scope.m_url = "";
    $scope.addAndClose = function () {
        console.log("addAndClose");
        $scope.url = $scope.m_url;
        $scope.addURL();
        $scope.m_url = "";
    };

    $scope.callAddURL = function (url) {
        console.log("callAddURL");
        $scope.url = url;
        $scope.addURL();
    };
});
