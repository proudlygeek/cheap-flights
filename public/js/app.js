(function(angular) {
  'use strict';

  var app = angular.module('myApp', [])
  /**
   * Applications Costants.
   * ----------------------
   * 
   * Those are used for mapping keyboard keycodes 
   * (which is used by the autocomplete directive) and 
   * for specificing different API endpoints.
   * 
   */
  .constant('KEYBOARD', {
    UP: 38,
    DOWN: 40,
    TAB: 9,
    ENTER: 13
  })
  .constant('API', {
    AIRPORTS: '/cors/https://ryanair-test.herokuapp.com/api/airports',
    IATA_CODES: '/cors/https://www.ryanair.com/en/api/2/forms/flight-booking-selector/',
    CHEAP_FLIGHTS: '/cors/https://www.ryanair.com/en/api/2/flights/'
  })
  /**
   * Main App Controller
   * -------------------
   *
   * This controller is used to fetch data from remote airport API 
   * and to coordinate the directive's (autocomplete and calendar) 
   * different behaviour.
   * 
   */
  .controller('FormCtrl', function($rootScope, $scope, $timeout, Flights) {
    Flights.airports().then(function(data) {
      $scope.airports = data;
    });

    $scope.setDestination = function(airport) {
      Flights.getDestinationsFor(airport.iataCode)
        .then(function(airports) {
          $scope.destinationAirports = airports;

          $timeout(function() {
            $rootScope.$emit('formChange');
          }, 0);
        });
    };

    $scope.changed = function() {
      $timeout(function() {
        $rootScope.$emit('formChange');
      }, 0);
    };

  })
  /**
   * Autocomplete Directive
   * ----------------------
   *
   * A generic, re-usable component for user-input
   * suggestions. Suggestions options can be choosed using:
   *
   * 1. Keyboards Arrow Up and Down;
   * 2. Typing;
   * 3. Clicking.
   *
   * It accepts the following angular attributes:
   *
   * name: attribute        ~> Specify input element's name with a `code-` suffix;
   * placeholder: attribute ~> Input placeholder's attribute;
   * items: model           ~> List of items to filter;
   * on-select: function    ~> Callback to execute after selection.
   *  
   */
  .directive('autocomplete', function(KEYBOARD, $timeout) {
    var linker = function(scope, el, attrs) {

      scope.selectIndex = 0;

      scope.onKeydown = function(e) {

        switch (e.which) {
          case KEYBOARD.ENTER:
          case KEYBOARD.TAB:
            e.preventDefault();
            var nextInput = el.next('autocomplete').find('input');

            scope.onBlur(e);

            if (nextInput[0]) {
              nextInput[0].focus();
            }

            break;

          case KEYBOARD.DOWN:
            e.preventDefault();

            if (scope.selectIndex < scope.filtered.length - 1) {
              scope.selectIndex++;
            }
            break;

          case KEYBOARD.UP:
            e.preventDefault();

            if (scope.selectIndex > 0) {
              scope.selectIndex--;
            }
            break;

          default:
            scope.selected = false;
        }
      };

      scope.selectFromClick = function(e) {
        scope.selectIndex = angular.element(e.currentTarget.parentNode).attr('data-index');
        scope.onBlur();
      };

      scope.onBlur = function(e) {
        if (e && e.relatedTarget && angular.element(e.relatedTarget).hasClass('item')) {
          return false;
        }

        $timeout(function(){
          scope.focused = false;
          if (scope.filtered && scope.filtered.length) {
            scope.selected = true;
            scope.autocompleteInput = scope.filtered[scope.selectIndex].name;
            scope.autocompleteCode = scope.filtered[scope.selectIndex].iataCode;
            scope.onSelect({ selection: scope.filtered[scope.selectIndex] });
          }     
        }, 100);
      };

      scope.onFocus = function(e) {
        scope.focused = true;
        scope.selectIndex = 0;
        scope.autocompleteInput = '';
      };
    };

    return {
      scope: {
        'placeholder': '@',
        'name': '@',
        'items': '=',
        'onSelect': '&'
      },
      restrict: 'EA',
      transclude: true,
      templateUrl: 'templates/autocomplete.html',
      link: linker
    };
  })
  /**
   * Datepicker Directive
   * --------------------
   *
   * It displays a classic 1-month, paginated calendar
   * picker.
   *
   * It accepts the following angular attributes:
   *
   * name: attribute        ~> Specify input element's name with a `date-` suffix;
   * starts-from: attribute ~> Specify offset days starting from now (e.g +1, +2, etc.); 
   * on-select: function    ~> Function to execute after selection.
   * 
   */
  .directive('datepicker', function($filter, $timeout) {
    var linker = function(scope, el, attrs) {
      var now = new Date();

      var getMonthDays = function(year, month) {
        return new Date(year, month + 1, 0).getDate();
      };

      var getFirstMonthWeekDay = function(year, month) {
        return new Date(year, month, 1).getDay();
      };

      var getWeeks = function(start, num, month, year) {
        var dates = [],
            numWeeks = Math.ceil((num + start) / 7);

        for (var i = 0; i < numWeeks; i++){
          dates[i] = [];

          for (var j = 0; j < 7; j++){
            if (i == 0 && j < start){
              dates[i].push({date:'', label: ''});
            } else {
              var day = (j - start + 1) + (i * 7);
              dates[i].push(day <= num ? {date: new Date(year, month, day), label: day} : {date:'', label: ''});
            }
          }
        }

        return dates;
      };

      scope.onFocus = function() {
        scope.selected = true;
      }

      scope.onBlur = function(e) {

        var target = angular.element(e.relatedTarget);

        if (target.hasClass('day')
          || target.hasClass('prev')
          || target.hasClass('next')) {
          return false;
        }

        $timeout(function() {
          scope.selected = false;
        }, 100);
      }

      scope.prevMonth = function() {
        var date = new Date(scope.year, scope.month, 1);
        date.setDate(date.getDate() - 1);

        scope.year = date.getFullYear();
        scope.month = date.getMonth();
        scope.updateWeeks();
      };

      scope.nextMonth = function() {
        var date = new Date(scope.year, scope.month, 1);
        date.setDate(date.getDate() + getMonthDays(scope.year, scope.month));

        scope.year = date.getFullYear();
        scope.month = date.getMonth();
        scope.updateWeeks();
      };

      scope.submitDay = function(date) {
        scope.date = $filter('date')(date, 'dd MMM yyyy');
        scope.dateAlt = $filter('date')(date, 'yyyy-MM-dd');
        scope.onSelect({message: scope.date });
        scope.selected = false;
      }

      scope.updateWeeks = function() {
        scope.titleDate = $filter('date')(new Date(scope.year, scope.month, 1), 'MMM yyyy');

        scope.weeks = getWeeks(
          getFirstMonthWeekDay(scope.year, scope.month) - 1,
          getMonthDays(scope.year, scope.month),
          scope.month,
          scope.year
        );
      };

      scope.year = now.getFullYear(),
      scope.month = now.getMonth();
      scope.updateWeeks();

      scope.submitDay(now.setDate(now.getDate() + Number(scope.startsFrom)));
      scope.today = $filter('date')(new Date(), 'yyyy-MM-dd');
    };

    return {
      scope: {
        'name': '@',
        'startsFrom': '@',
        'onSelect': '&'
      },
      restrict: 'EA',
      transclude: true,
      templateUrl: 'templates/datepicker.html',
      link: linker
    };
  })
  /**
   * Flight Search Directive
   * -----------------------
   *
   * Search and display the cheapest flight
   * for the current airports and dates range selection.
   *
   * It accepts the following angular attributes:
   *  
   * from-airport: attribute ~> input[name] of the autocomplete (FROM);
   * to-airport: attribute   ~> input[name] of the autocomplete (TO);
   * from: attribute         ~> input[name] of the autocomplete (DATE FROM);
   * to: attribute           ~> input[name] of the autocomplete (DATE TO).
   * 
   */
  .directive('searchFlights', function($rootScope, Flights) {
    var linker = function(scope, el, attrs) {

      $rootScope.$on('formChange', function() {
        var formContainer = el[0].parentElement,
            args = {
              from: formContainer.querySelector('input[name="date-'+ scope.from +'"]').value,
              to: formContainer.querySelector('input[name="date-'+ scope.to +'"]').value,
              fromAirport: formContainer.querySelector('input[name="code-'+ scope.fromAirport +'"]').value,
              toAirport: formContainer.querySelector('input[name="code-'+ scope.toAirport +'"]').value
            };

        if (args.fromAirport === '' || args.toAirport === '') {
          return;
        }
            
        Flights.fetchCheapFlights(args)
          .then(function(response) {
            scope.flights = response.flights;
        });

      });
    };

    return {
      scope: {
        'buttonName': '@',
        'fromAirport': '@',
        'toAirport': '@',
        'from': '@',
        'to': '@'
      },
      restrict: 'EA',
      transclude: true,
      templateUrl: 'templates/search-flights.html',
      link: linker
    };
  })
  .service('Flights', function($http, $cacheFactory, API) {
    var lruCache = $cacheFactory('lruCache', { capacity: 50 });

    var unwrapResponse = function(response) {
      return response.data;
    };

    var airports = function() {
      return $http.get(API.AIRPORTS, { cache: lruCache })
        .then(unwrapResponse);
    };

    var getIATACodes = function() {
      return $http.get(API.IATA_CODES, { cache: lruCache })
        .then(unwrapResponse);
    };

    var getDestinationsFor = function(code) {
      return getIATACodes()
        .then(function(data) {
          return data.routes[code];
        })
        .then(function(codes) {
          return airports().then(function(airports) {
            return airports.filter(function(item) {
              return (codes.indexOf(item.iataCode) >= 0);
            });
          });
        });
    };

    var fetchCheapFlights = function(args) {
      var qs = [ 
        'from', args.fromAirport, 
        'to', args.toAirport, 
        args.from, args.to 
      ].join('/');

      return $http.get(API.CHEAP_FLIGHTS + qs + '/250/unique/?limit=15&offset-0')
        .then(unwrapResponse);
    };

    return {
      airports: airports,
      getDestinationsFor: getDestinationsFor,
      fetchCheapFlights: fetchCheapFlights
    };
  });
})(window.angular);
