/**
 * Minds::mobile
 * Login controller
 *
 * @author Mark Harding
 */

define(function() {
	'use strict';

	function ctrl($rootScope, $scope, $state, OAuth, Client, $ionicPopup, storage, push, $ionicModal, $ionicLoading) {

		$scope.data = {
			referrer: ''
		};

		$scope.inprogress = false;

		$scope.toTutorial = function() {
			$state.go('tutorial');
		};

		$scope.toNewsfeed = function() {
			$state.go('tab.newsfeed');
		};

		$scope.register = function() {
			if ($scope.inprogress)
				return false;

			if (!$scope.data.username) {
				$ionicPopup.alert({
					title: 'Ooops..',
					template: "You need to enter a username"
				});
				return false;
			}

			if (!$scope.data.password) {
				$ionicPopup.alert({
					title: 'Ooops..',
					template: "You need to enter a password"
				});
				return false;
			}

			if (!$scope.data.email) {
				$ionicPopup.alert({
					title: 'Ooops..',
					template: "You need to enter an email address"
				});
				return false;
			}

			$scope.inprogress = true;
			$ionicLoading.show({
				template: 'Please wait a moment...'
			});

			Client.post('api/v1/register', {
				username: $scope.data.username,
				password: $scope.data.password,
				email: $scope.data.email,
				referrer: $scope.data.referrer
			}, function(success) {
				$ionicLoading.hide();

				if (success.status == 'error') {
					$scope.inprogress = false;

					var alertPopup = $ionicPopup.alert({
						title: 'Ooops..',
						template: success.message
					});

					return false;
				}

				$ionicLoading.show({
					template: 'Logging in...'
				});

				OAuth.login($scope.data.username, $scope.data.password, function(success) {
					$ionicLoading.hide();
					if (success) {
						//$state.go('tab.newsfeed');
						$rootScope.user_guid = storage.get('user_guid');
						push.register();

						//load popup so we upload avatar
						$ionicModal.fromTemplateUrl('templates/modals/avatar.html', {
							scope: $scope,
							animation: 'slide-in-up'
						}).then(function(modal) {
							$scope.modal = modal;
							$scope.modal.show();
						});

						//optional slide
						$ionicModal.fromTemplateUrl('templates/modals/optional.html', {
							scope: $scope,
							animation: 'slide-in-up'
						}).then(function(modal) {
							$scope.modal2 = modal;
						});

					} else {

						var alertPopup = $ionicPopup.alert({
							title: 'Ooops..',
							template: 'We couldn\'t log you in. Please check your credentials and try again.'
						});

						//clear the password?
						alertPopup.then(function(res) {

						});

					}
					$scope.inprogress = false;
				}, function(error) {
					$ionicLoading.hide();
					$scope.inprogress = false;
				});
			}, function(error) {
				$scope.inprogress = false;
				$ionicLoading.hide();
				var alertPopup = $ionicPopup.alert({
					title: 'Ooops..',
					template: 'Something went wrong.. Try again later.'
				});
			});

		};

		$scope.searching = false;

		$scope.searchUsers = function($event) {
			$scope.searching = true;
			if ($scope.data.referrer.charAt(0) != '@' && $scope.data.referrer.length !== 0) {
				$scope.data.referrer = '@' + $scope.data.referrer;
			}

			//if($event.keyCode == 13){
			//	$scope.searching = false;
			//}

			var query = $scope.data.referrer;
			if (query.charAt(0) == '@') {
				query = query.substr(1);
			}

			Client.get('search', {
				q: query,
				type: 'user',
				view: 'json',
				limit: 5
			}, function(success) {
				$scope.results = success.user[0];
			});

			console.log('changing');

			if (!$scope.data.referrer) {
				$scope.searching = false;
			}
		};

		$scope.selectReferrer = function(user) {
			$scope.searching = false;
			$scope.data.referrer = '@' + user.username;
		};

	}


	ctrl.$inject = ['$rootScope', '$scope', '$state', 'OAuth', 'Client', '$ionicPopup', 'storage', 'push', '$ionicModal', '$ionicLoading'];
	return ctrl;

});
