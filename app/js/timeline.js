angular
	.module('showfast', ['ngRoute', 'nvd3ChartDirectives'])
	.config([
		'$routeProvider', function($routeProvider) {
			$routeProvider.
				when('/timeline/:os/:component/:category', {templateUrl: '/static/timeline.html', controller: MenuRouter}).
				when('/runs/:metric/:build', {templateUrl: '/static/runs.html', controller: RunList}).
				otherwise({redirectTo: 'timeline/Linux/kv/max_ops'});
		}
	])
	.controller('MainDashboard', MainDashboard);

function MainDashboard($scope, $http, $routeParams) {
	DefineMenu($scope, $http);

	var format = d3.format(',');
	$scope.valueFormatFunction = function() {
		return function(d) {
			return format(d);
		};
	};

	$scope.$on('elementClick.directive', function(event, data) {
		var build = data.data[0],
			metric = event.targetScope.id,
			a = $("#run_"  + metric);
		a.attr("href", "/#/runs/" + metric + "/" + build);
		a[0].click();
	});
}

function MenuRouter($scope, $http, $routeParams, $location) {
	$scope.activeOS = $routeParams.os;
	$scope.activeComponent = $routeParams.component;
	$scope.activeCategory = $routeParams.category;

	$http.get('/api/v1/metrics/' + $scope.activeComponent + "/" + $scope.activeCategory).success(function(metrics) {
		$scope.metrics = metrics;

		$.each(metrics, function(i, metric) {
			$http.get('/api/v1/timeline/' + metric.id).success(function(data) {
				$scope.metrics[i].chartData = [{key: metric.id, values: data}];
			});
		});
	});

	$scope.setActiveOS = function(os) {
		$location.path("/timeline/" + os + "/" + $scope.activeComponent + "/" + $scope.activeCategory);
	};

	$scope.setActiveComponent = function(component) {
		$location.path("/timeline/" + $scope.activeOS + "/" + component + "/" + $scope.components[component].categories[0].id);
	};

	$scope.setActiveCategory = function(category) {
		$location.path("/timeline/" + $scope.activeOS + "/" + $scope.activeComponent + "/" + category);
	};

	DefineFilters($scope);
}

function DefineMenu($scope, $http) {
	$http.get('/static/menu.json').success(function(menu) {
		$scope.components = menu.components;
		$scope.oses =  menu.oses;
	});
}

function DefineFilters($scope) {
	$scope.byOS = function(metric) {
		switch($scope.activeOS) {
			case "Linux":
				return metric.cluster.os.indexOf("Windows") === -1;
			case "Windows":
				return metric.cluster.os.indexOf("Windows") === 0;
		}
	};
}

function RunList($scope, $routeParams, $http) {
	$http.get('/api/v1/runs/' + $routeParams.metric + '/' + $routeParams.build).success(function(data) {
		$scope.runs = data;
	});
}