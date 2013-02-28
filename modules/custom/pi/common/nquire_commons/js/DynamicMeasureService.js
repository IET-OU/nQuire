
/*global nQuireJsSupport*/

$(function() {
  var DynamicMeasureServiceDelegate = function(service, elementId) {
    this._service = service;
    this._elementId = elementId;
  };

  DynamicMeasureServiceDelegate.prototype.saveData = function(data) {
    this._service._saveData(this._elementId, data);
  };

  DynamicMeasureServiceDelegate.prototype.getData = function() {
    return this._service._getData(this._elementId);
  };

  DynamicMeasureServiceDelegate.prototype.randomDelayProcessStarted = function() {
    this._service._randomDelayProcessStarted(this._elementId);
  };

  DynamicMeasureServiceDelegate.prototype.randomDelayProcessStopped = function() {
    this._service._randomDelayProcessStopped(this._elementId);
  };

  DynamicMeasureServiceDelegate.prototype.userDelayProcessStarted = function() {
    this._service._userDelayProcessStarted(this._elementId);
  };

  DynamicMeasureServiceDelegate.prototype.userDelayProcessStopped = function() {
    this._service._userDelayProcessStopped(this._elementId);
  };



  nQuireJsSupport.register('DynamicMeasureService', {
    _measureHandlers: null,
    _ongoingRandomDelayProcesses: null,
    _ongoingUserDelayProcesses: null,
    _endDataInputCallback: null,
    init: function() {
      this._measureHandlers = {};
      this._ongoingRandomDelayProcesses = {};
      this._ongoingUserDelayProcesses = {};
    },
    registerMeasure: function(elementId, handler) {
      this._measureHandlers[elementId] = handler;
      handler.setServiceDelegate(new DynamicMeasureServiceDelegate(this, elementId));
      handler.initMeasureValue(this._getData(elementId));
    },
    endDataInput: function(endDataInputCallback) {
      this._endDataInputCallback = endDataInputCallback;
      this.stopUserInputProcesses();
      this._checkEndOfDataInput();
    },
    stopUserInputProcesses: function() {
      for (var elementId in this._ongoingUserDelayProcesses) {
        if (this._ongoingUserDelayProcesses[elementId]) {
          var handler = this._measureHandlers[elementId];
          handler.stopUserDelayProcess();
          this._ongoingUserDelayProcesses[elementId] = false;
        }
      }
    },
    _checkEndOfDataInput: function() {
      if (this._endDataInputCallback) {
        var ended = true;
        for (var elementId in this._ongoingRandomDelayProcesses) {
          if (this._ongoingRandomDelayProcesses[elementId]) {
            ended = false;
            break;
          }
        }

        if (ended) {
          var f = this._endDataInputCallback;
          this._endDataInputCallback = null;
          f();
        }
      }
    },
    _saveData: function(elementId, data) {
      $('input[name="' + elementId + '"]').val(data);
    },
    _getData: function(elementId) {
      return $('input[name="' + elementId + '"]').val();
    },
    _randomDelayProcessStarted: function(elementId) {
      this._ongoingRandomDelayProcesses[elementId] = true;
    },
    _randomDelayProcessStopped: function(elementId) {
      this._ongoingRandomDelayProcesses[elementId] = false;
      this._checkEndOfDataInput();
    },
    _userDelayProcessStarted: function(elementId) {
      this._ongoingUserDelayProcesses[elementId] = true;
    },
    _userDelayProcessStopped: function(elementId) {
      this._ongoingUserDelayProcesses[elementId] = false;
    }
  });
});


(function($) {
  var methods = {
    init: function(options) {
      this.addClass('dynamic_measure_link');
      if (options.disabled) {
        this.addClass('dynamic_measure_link_disabled');
      }

      this.click(function() {
        if (!$(this).hasClass('dynamic_measure_link_disabled')) {
          options.callback();
        }
        return false;
      });
      return this;
    },
    enable: function() {
      this.removeClass('dynamic_measure_link_disabled');
    },
    disable: function() {
      this.addClass('dynamic_measure_link_disabled');
    }
  };

  $.fn.nQuireDynamicMeasureLink = function(method) {
    if (methods[method]) {
      return methods[method].apply(this, Array.prototype.slice.call(arguments, 1));
    } else if (typeof method === 'object' || !method) {
      return methods.init.apply(this, arguments);
    } else {
      console.log('Method ' + method + ' does not exist on jQuery.nQuireDynamicMeasureLink');
      return false;
    }
  };
})(jQuery);


