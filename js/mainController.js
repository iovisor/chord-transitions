angular.module('app', []);

angular.module('app').controller('mainCntrl', ['$scope', 
function ($scope) {

  $scope.master = {}; // MASTER DATA STORED BY VNI

  $scope.selected_vni = "all";
  $scope.vnis = ["all"];

  $scope.filters = {};
  $scope.hasFilters = false;
  $scope.refreshTimeout = 15 * 1000;
  $scope.refreshLabel = "stop";

  $scope.tooltip = {};

  $scope.toggleRefresh = function () {
    if ($scope.refreshTimeout > 0) {
      $scope.refreshTimeout = 0;
      $scope.refreshLabel = "start";
      window.clearTimeout($scope.refreshTimer);
    } else {
      $scope.refreshTimeout = 15 * 1000;
      $scope.refreshLabel = "stop";
      $scope.refreshData();
    }
  };

  // FORMATS USED IN TOOLTIP TEMPLATE IN HTML
  $scope.pFormat = d3.format(".1%");  // PERCENT FORMAT
  $scope.qFormat = d3.format(",.0f"); // COMMAS FOR LARGE NUMBERS

  $scope.updateTooltip = function (data) {
    $scope.tooltip = data;
    $scope.$apply();
  }

  $scope.addFilter = function (name) {
    $scope.hasFilters = true;
    $scope.filters[name] = {
      name: name,
      show: true
    };
    $scope.$apply();
  };

  $scope.update = function () {
    var data = [];
    if ($scope.selected_vni === 'all') {
      Object.keys($scope.master).forEach(function (k) {
        data = data.concat($scope.master[k]);
      });
    } else {
      data = $scope.master[$scope.selected_vni];
    }

    if ($scope.hasFilters) {
      data = data.filter(function (d) {
        var fl = $scope.filters;
        var v1 = d.outer_sip;
        var v2 = d.outer_dip;
        if ((fl[v1] && fl[v1].show) || (fl[v2] && fl[v2].show)) {
          return true;
        }
        return false;
      });
    }

    // put the interesting fields into something chord will display
    data = data.map(function (d) {
      if ($scope.hasFilters) {
        d.edge1 = d["inner_sip"];
        d.edge2 = d["inner_dip"];
      } else {
        d.edge1 = d["outer_sip"];
        d.edge2 = d["outer_dip"];
      }
      d.value1 = d["rx_bytes"];
      d.value2 = d["tx_bytes"];
      return d;
    });

    if (data) {
      $scope.drawChords(data);
    }
  };

  $scope.refreshData = function () {
    $.getJSON('../data/tunnel-total.json', function (data) {
      $scope.master = {};
      data.forEach(function (d) {
        if (!$scope.master[d.vni]) {
          $scope.master[d.vni] = [];
        }
        $scope.master[d.vni].push(d);
      })
      $scope.vnis = ["all"].concat(Object.keys($scope.master));
      $scope.update();
      if ($scope.refreshTimeout > 0) {
        $scope.refreshTimer = window.setTimeout($scope.refreshData, $scope.refreshTimeout);
      }
    });
  };
  $scope.refreshData();

  $scope.$watch('selected_vni', $scope.update);
  $scope.$watch('filters', $scope.update, true);
  $scope.$watch('reset', $scope.resetData);

}]);
