/**
 * Minds::mobile
 * Notifications controller
 *
 * @author Mark Harding
 */

define(function() {
	'use strict';

	function ctrl($rootScope, $scope, $stateParams, $ionicScrollDelegate, Cacher, Client, storage, $ionicPopover, $ionicLoading, $ionicActionSheet) {

		console.log('guid is... ' + $stateParams.guid);

		cordova.plugins.Keyboard.disableScroll(true);

		$scope.guid = '';
		$scope.cb = Date.now();
		$scope.offset = "";
		$scope.hasMore = false;
		$scope.comments = [];
		$scope.comment = {};
		$scope.comment.body = '';

		$scope.init = function() {
			Client.get('api/v1/entities/entity/' + $stateParams.guid, {
				cb: $scope.cb
			}, function(data) {

				$scope.entity = data.entity;
				$scope.activity = data.entity;

				$scope.guid = $scope.entity.guid;

				if ($scope.entity.entity_guid) {
					$scope.guid = $scope.entity.entity_guid;
				}

				$scope.hasMore = true;
				$scope.offset = "";
				$scope.cb = Date.now();
				$scope.comments = [];
				$scope.getComments();

			}, function(error) {
				console.log(error);
			});
		};
		$scope.init();

		$scope.inprogress = false;
		$scope.getComments = function() {
			if ($scope.inprogress) {
				return false;
			}
			$scope.inprogress = true;
			/**
			 * Gather comments
			 */
			Client.get('api/v1/comments/' + $scope.guid, {
				cb: $scope.cb,
				limit: 5,
				offset: $scope.offset,
				reversed: true
			}, function(data) {

				$scope.inprogress = false;

				if (!data.comments || data.comments.length === 0) {
					$scope.hasMore = false;
					return false;
				}

				//if 3/5 results not returned, assume no more
				if (data.comments.length < 3) {
					$scope.hasMore = false;
				}

				$scope.comments = data.comments.concat($scope.comments);
				$scope.offset = data['load-previous'];

				if ($scope.offset == null) {
					$scope.hasMore = false;
				}

				$scope.$broadcast('scroll.infiniteScrollComplete');
			}, function(error) {
				$scope.inprogress = false;
			});

		};

		$scope.submit = function() {
			if (!$scope.comment.body) {
				return;
			}

			Client.post('api/v1/comments/' + $scope.guid, {
				comment: encodeURIComponent($scope.comment.body)
			}, function(data) {

				$scope.comments.push(data.comment);
				$scope.offset = data.guid;

			}, function(error) {
			});
			$scope.comment.body = '';
		};

		$scope.openUrl = function(url) {
			var timeout;
			$timeout.cancel(timeout);

			timeout = $timeout(function() {
				window.open(url, "_blank", "location=yes");
			}, 300);
		};

		$scope.pass = function() {
			Client.post('api/v1/entities/suggested/pass/' + $scope.entity.guid, {}, function() {
			}, function() {
			});
			$scope.entity['thumbs:pass:count'] = 1;
		};

		$scope.down = function() {
			Client.put('api/v1/thumbs/' + $scope.entity.guid + '/down', {}, function(success) {
			}, function(error) {
			});

			for (var key in $scope.entity['thumbs:down:user_guids']) {
				if ($scope.entity['thumbs:down:user_guids'][key] === storage.get('user_guid')) {
					delete $scope.entity['thumbs:down:user_guids'][key];
					$scope.entity['thumbs:down:count'] = $scope.entity['thumbs:down:count'] - 1;

					return true;
				}
			};

			if ($scope.entity['thumbs:down:count'])
				$scope.entity['thumbs:down:count'] = $scope.entity['thumbs:down:count'] + 1;
			else
				$scope.entity['thumbs:down:count'] = 1;

			$scope.entity['thumbs:down:user_guids'][1] = storage.get('user_guid');

		};

		$scope.up = function() {

			Client.put('api/v1/thumbs/' + $scope.entity.guid + '/up', {}, function(success) {
			}, function(error) {
			});

			for (var key in $scope.entity['thumbs:up:user_guids']) {
				if ($scope.entity['thumbs:up:user_guids'][key] === storage.get('user_guid')) {
					delete $scope.entity['thumbs:up:user_guids'][key];
					$scope.entity['thumbs:up:count'] = $scope.entity['thumbs:up:count'] - 1;

					return true;
				}
			};

			if ($scope.entity['thumbs:up:count'])
				$scope.entity['thumbs:up:count'] = $scope.entity['thumbs:up:count'] + 1;
			else
				$scope.entity['thumbs:up:count'] = 1;

			$scope.entity['thumbs:up:user_guids'][1] = storage.get('user_guid');
		};

		$scope.edit = function(comment) {
			if (!comment.description) {
				return;
			}
			comment.editing = false;
			$scope.editing = false;
			Client.post('api/v1/comments/update/' + comment.guid, comment, function() {

			}, function(error) {
			});
		};

		$scope.openCommentActions = function(comment) {
			var guid = comment.guid;
			if (comment.owner_guid != $rootScope.user_guid)
				return false;

			$ionicActionSheet.show({
				buttons: [{
					text: 'Edit'
				}],
				destructiveText: 'Delete',
				destructiveButtonClicked: function() {
					if (confirm("are you sure?")) {

						Client.delete('api/v1/comments/' + guid, function(success) {

						});
						$scope.comments.forEach(function(item, index, array) {
							if (item.guid == guid) {
								console.log('removed');
								array.splice(index, 1);
							}
						});
					}
					return true;
				},
				cancelText: 'Cancel',
				cancel: function() {
					// add cancel code..
				},
				buttonClicked: function(index) {
					switch (index) {
						case 0:
						if (comment.owner_guid != $rootScope.user_guid) {

							$ionicLoading.show({
								template: 'Sorry, you can not edit comments that are not yours.'
							});
							$timeout(function() {
								$ionicLoading.hide();
							}, 1000);

							return false;

						} else {
							//to make comment editable
							comment.editing = true;
						}
						break;
					}
					return true;
				}
			});
		};

	}


	ctrl.$inject = ['$rootScope', '$scope', '$stateParams', '$ionicScrollDelegate', 'Cacher', 'Client', 'storage', '$ionicPopover', '$ionicLoading', '$ionicActionSheet'];
	return ctrl;

});
