
(function($) {

  var methods = {
    init: function(options) {

      var _options = $.extend({
        availableActivities: {activities: {}, phases: {}}
      }, options);

      this.data('availableTypes', _options.availableActivities);
      this.data('nextNewId', 0);

      this.nQuireWidget({
        defaultValue: '[]'
      });

      this.addClass('inquiry-structure-container');


      var self = this;

      $('#inquiry-structure-add-phase').click(function(event) {
        self.inquiryStructureWidget('_openNewItemDialog', $('#inquiry-structure-add-phase'), 'phase', this);
        event.preventDefault();
        event.stopPropagation();
      });

      this.inquiryStructureWidget('_initData');
    },
    _initData: function() {
      var originalData = this.nQuireWidget('getDataValue', 'object');
      console.log(originalData);

      var status = [];
      for (var i = 0; i < originalData.length; i++) {
        var phase = originalData[i];
        status[phase.id] = {status: 'saved', pos: i};
        for (var j = 0; j < phase.activities.length; j++) {
          status[phase.activities[j].id] = {status: 'saved', modified: false, startpos: [phase.id, j]};
        }
      }
      this.data('status', status);
      this.inquiryStructureWidget('_buildStructure', originalData);
      return this;
    },
    _buildStructure: function(data) {
      for (var i = 0; i < data.length; i++) {
        var activities = data[i].activities;
        this.inquiryStructureWidget('_buildItemElement', data[i], 'phase');
        for (var j = 0; j < activities.length; j++) {
          this.inquiryStructureWidget('_buildItemElement', activities[j], 'activity');
        }
      }

      this.inquiryStructureWidget('_updateView');

      this.inquiryStructureWidget('_enableSaveButton', false);

      return this;
    },
    _buildItemElement: function(item, type, container) {
      var self = this;
      var element = $('<div>').attr('item-id', item.id)
              .addClass('inquiry-structure-' + type + '-container');

      if (type === 'phase') {
        this.append(element);
      } else if (container) {
        container.append(element);
      } else {
        this.children(':last').append(element);
      }

      element.data('item', item);
      element.data('type', type);

      $('<div>').addClass('inquiry-structure-tree-bullet-' + type).appendTo(element);
      $('<div>').addClass('inquiry-item-handle').appendTo(element);
      var itemElement = $('<div>').addClass('inquiry-structure-' + type).appendTo(element);
      $('<div>').addClass('inquiry-item-buttons').appendTo(element);

      var data = $('<div>').addClass('item-data').appendTo(itemElement);

      $('<div>').addClass('item-status').html('*').appendTo(data);
      if (type === 'phase') {
        $('<div>').addClass('inquiry-phase-icon').appendTo(data);
      } else {
        $('<div>').addClass('inquiry-activity-icon').addClass(item.type).appendTo(data);
      }
      $('<div>').addClass('inquiry-' + type + '-title').html(item.title).appendTo(data);

      var start = function(event, ui) {
        ui.item.data('originalPositionTop', ui.item.offset().top);
      };
      var stop = function(event, ui) {
        var id = ui.item.attr('item-id');
        var sorted = ui.item.offset().top !== ui.item.data('originalPositionTop');
        if (sorted) {
          self.inquiryStructureWidget('_modifyItem', id, 'modified');
        }
      };

      this.sortable({items: ".inquiry-structure-phase-container", handle: '.inquiry-item-handle', revert: 100, start: start, stop: stop});
      this.children().each(function() {
        $(this).sortable({items: ".inquiry-structure-activity-container", connectWith: '.inquiry-structure-phase-container', handle: '.inquiry-item-handle', revert: 100, start: start, stop: stop});
      });


      this.inquiryStructureWidget('_updateItemInfo', item.id);
      return this;
    },
    _updateItemInfo: function(itemId) {
      var self = this;

      var status = this.data('status')[itemId].status;
      var element = this.find('div[item-id="' + itemId + '"]');

      element.find('.item-data').removeClass()
              .addClass('item-data item-' + status);

      var buttons = element.find('.inquiry-item-buttons');
      buttons.html('');

      buttons.append('&nbsp;&nbsp;');
      if (status === 'deleted') {
        buttons.append(this.inquiryStructureWidget('_createLink', 'undelete', 'do not delete'));
      } else {
        //.append(this.inquiryStructureWidget('_createLink', 'rename', 'rename'))
        //.append('&nbsp;&nbsp;')
        buttons.append(this.inquiryStructureWidget('_createLink', 'delete', 'delete'));
        if (element.hasClass('inquiry-structure-phase-container')) {
          buttons.append('&nbsp;&nbsp;&nbsp;');
          buttons.append(this.inquiryStructureWidget('_createLink', 'addactivity', 'add activity'));
        }
      }

      buttons.children().click(function(event) {
        self.inquiryStructureWidget('_itemAction', $(this), itemId, $(this).attr('op'));
        event.preventDefault();
        event.stopPropagation();
      });

      return this;
    },
    _createLink: function(op, title) {
      return $('<a>').attr('op', op).html(title).attr('href', '#').addClass('link-button');
    },
    _openNewItemDialog: function(button, type, container) {
      var self = this;

      var head = type === 'activity' ?
              "Click on an activity to add it to the inquiry." :
              "Click on a phase to add it to the inquiry.";

      var types = this.data('availableTypes')[type];

      button.nQuireTooltip({
        creationCallback: function(content) {

          content.append($('<p>').html(head));

          var list = $('<ul>').appendTo(content);
          for (var key in types) {
            var itemLi = $('<li>').appendTo(list);
            var item = self.inquiryStructureWidget('_createLink', 'new', types[key].title).attr('item-type', key).appendTo(itemLi);

            item.click(function() {
              var selectedKey = $(this).attr('item-type');
              self.nQuireTooltip('close');
              self.inquiryStructureWidget('_createItem', type, selectedKey, container);
              self.inquiryStructureWidget('_dataModified');
            });
          }

          $('<a>').attr('href', '#').html('Cancel').click(function() {
            self.nQuireTooltip('close');
          }).appendTo($('<p>').appendTo(content));
        }
      });
    },
    _createItem: function(category, type, container) {
      var n = this.data('nextNewId');
      this.data('nextNewId', n + 1);

      var id = 'new' + n;
      var definition = this.data('availableTypes')[category][type];

      var item = {
        id: id,
        type: type,
        title: definition.title
      };

      var status = this.data('status');
      status[id] = {status: 'new'};
      this.data('status', status);

      this.inquiryStructureWidget('_buildItemElement', item, category, container);

      if (category === 'phase') {
        for (var i = 0; i < definition.activities.length; i++) {
          this.inquiryStructureWidget('_createItem', 'activity', definition.activities[i]);
        }
      }
    },
    _modifyItem: function(itemId, action) {
      var status = this.data('status');

      if (action === 'modified') {
        if (status[itemId].status !== 'new') {
          status[itemId].status = 'modified';
          this.inquiryStructureWidget('_updateItemInfo', itemId);
        }
      }

      this.data('status', status);

      this.inquiryStructureWidget('_dataModified');
    },
    _itemAction: function(button, itemId, action) {
      if (action === 'addactivity') {
        var container = this.find('div[item-id="' + itemId + '"]');
        this.inquiryStructureWidget('_openNewItemDialog', button, 'activity', container);
      } else {
        alert(itemId + ' ' + action);
      }
    },
    _updatePhaseNumbers: function() {
      var i = 0;
      $('.inquiry-phase-icon').each(function() {
        $(this).removeClass().addClass('inquiry-phase-icon')
                .html('Phase ' + (i + 1) + ':&nbsp;');
        i++;
      });
    },
    _dataModified: function() {
      var data = [];
      this.children('.inquiry-structure-phase-container').each(function() {
        var phase = $(this);
        var phaseItem = phase.data('item');
        phaseItem.activities = [];
        phase.children('.inquiry-structure-activity-container').each(function() {
          var activityItem = $(this).data('item');
          phaseItem.activities.push(activityItem);
        });
        data.push(phaseItem);
      });

      this.inquiryStructureWidget('_updateView');

      this.nQuireWidget('setDataValue', data);
      this.inquiryStructureWidget('_enableSaveButton', true);
      return this;
    },
    _enableSaveButton: function(enabled) {
      var button = $('#edit-submit');
      if (enabled) {
        button.removeAttr('disabled');
      } else {
        button.attr('disabled', 'disabled');
      }
      return this;
    }
  };

  $.fn.inquiryStructureWidget = function(method) {
    if (methods[method]) {
      return methods[method].apply(this, Array.prototype.slice.call(arguments, 1));
    } else if (typeof method === 'object' || !method) {
      return methods.init.apply(this, arguments);
    } else {
      console.log('Method ' + method + ' does not exist on jQuery.inquiryStructureWidget');
      return false;
    }
  };
})(jQuery);