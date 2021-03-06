/**
 * Minds::mobile
 * Newsfeed views
 *
 * @author Mark Harding
 */

define(function() {
	'use strict';

	function ctrl($rootScope, $scope, $stateParams, Client, $ionicLoading, $ionicActionSheet, $ionicHistory) {

		$scope.guid = "";
		$scope.cb = Date.now();
		$scope.activity = {};
		$scope.comments = [];
		$scope.comment = {};
		$scope.comment.body = '';

		$scope.init = function() {
			Client.get('api/v1/newsfeed/single/' + $stateParams.guid, {}, function(success) {
				$scope.activity = success.activity;
				if ($scope.activity.entity_guid) {
					$scope.guid = $scope.activity.entity_guid;
				} else {
					$scope.guid = $scope.activity.guid;
				}

				$scope.offset = "";
				$scope.hasMore = true;
				$scope.getComments();
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
				console.log($scope.offset);

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
			$ionicLoading.show({
				template: '<i class="icon ion-loading-d"></i>'
			});

			Client.post('api/v1/comments/' + $scope.guid, {
				comment: encodeURIComponent($scope.comment.body)
			}, function(data) {
				$ionicLoading.hide();
				$scope.comments.push(data.comment);
				$scope.cb = Date.now();

			}, function(error) {
			});
			$scope.comment.body = '';
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

						}
						else {
							//to hide the create comment section
							$scope.editing = true;
							//to make comment editable
							comment.editing = true;
						}
						break;
					}
					return true;
				}
			});
		};

		$scope.back = function() {
			$ionicHistory.goBack();
		};

	}


	ctrl.$inject = ['$rootScope', '$scope', '$stateParams', 'Client', '$ionicLoading', '$ionicActionSheet', '$ionicHistory'];
	return ctrl;

});
