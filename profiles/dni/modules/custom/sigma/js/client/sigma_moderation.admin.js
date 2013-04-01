(function($) {

  function AdminModerationController() {
    this.id = null;
    this.widgets = {
      new: {
        target: $('.sigma-widget.sigma-new .sigma-content'),
        id: false,
        size: 150,
        columns: 3,
        rows: 4,
        animation: 'vertical',
        pos: 3
      },
      accepted: {
        target: $('.sigma-widget.sigma-accepted .sigma-content'),
        size: 150,
        columns: 2,
        rows: 4
      },
      featured: {
        target: $('.sigma-widget.sigma-featured .sigma-content'),
        size: 150,
        columns: 1,
        rows: 4
      }
    };
    this.el = {
      subsList: $('#subscription-list'),
      moderation: $('#edit-moderation'),
      stop: $('#stop-moderation'),
      row: null
    };
  }


  AdminModerationController.prototype.init = function(self) {
    this.sigma = new Sigma({
      group: 'moderator',
      callbacks: {
        aOnline: {
          success: function(data) {
            self.isOnline(data);
          }
        },
        aExit: {
          success: function(data) {
            self.isOffline(data);
          }
        },
        aGetSubscription: {
          success: function(data) {
            self.refreshList(data);
          }
        },
        aUpdate: {
          success: function(data) {
            self.update(data);
          }
        }
      }
    }).init();
    this.sigma && this.start();
  };


  AdminModerationController.prototype.start = function() {
    var self = this;
    this.sigma.status.show();
    this.el.row = $('tr:last', this.el.subsList).attr('class', '').detach();
    this.el.stop.click(function() {
      self.el.stop.add(self.el.moderation).hide();
      self.el.subsList.show();
      Object.keys(self.widgets).forEach(function(widget) {
        self.widgets[widget].target.empty();
      });
      self.sigma.moderateSubscriptionStop(self.id);
      self.id = null;
      return false;
    });
  };


  AdminModerationController.prototype.isOnline = function() {
    this.sigma.online();
  };


  AdminModerationController.prototype.isOffline = function() {
    this.sigma.offline();
  };


  AdminModerationController.prototype.refreshList = function(data) {
    this.buildList(data);
  };


  AdminModerationController.prototype.buildList = function(data) {
    var self = this;
    $('tr:gt(0)', self.el.subsList).remove();
    var i = 0;
    Object.keys(data).forEach(function(id) {
      var item = data[id];
      var row = self.el.row.clone();
      $('td:eq(0)', row).text(id);
      $('td:eq(1)', row).text(item.object.charAt(0).toUpperCase() + item.object.slice(1));
      $('td:eq(2)', row).text('#' + item.object_id);
      $('td:eq(3)', row).text(item.moderated ? Drupal.t('Yes') : Drupal.t('No'));
      $('td:eq(4) a', row).click(function() {
        self.el.subsList.hide();
        self.el.stop.add(self.el.moderation).show();
        self.id = id;
        self.sigma.moderateSubscription(id);
        return false;
      });
      row.addClass(i++ % 2 ? 'even' : 'odd').appendTo(self.el.subsList);
    });
  };


  AdminModerationController.prototype.update = function(data) {
    if (this.id == data.id) {
      var self = this;
      data.data.forEach(function(item) {
        self.animateVertical(self.widgets.new, item);
      });
    }
  };


  AdminModerationController.prototype.newItem = function(conf, item) {
    var self = this;
    var src = item.images.thumbnail;
    var newItem = $('<a href="' + item.link + '" class="sigma-image" target="_blank">'
        + '<img width="' + conf.size + '" height="' + conf.size + '" src="' + src + '"/></a>')
      .mousedown(function(e) {
        e.preventDefault();
        switch (e.which) {
          case 1:
            self.moderated($(this), item, false);
            break;

          case 3:
            self.moderated($(this), item, true);
            break;
        }
        return false;
      }).bind('contextmenu', function() {
        return false;
      });
    return newItem;
  };


  AdminModerationController.prototype.animateVertical = function(conf, item) {
    var items = $('a', conf.target);
    var count = items.length;
    !conf.pos-- && (conf.pos = conf.columns - 1);
    var x = conf.pos * conf.size;
    var newItem = this.newItem(conf, item)
      .css({ left: x, top: 0 });
    conf.pos === conf.columns - 1 && items.stop(true, true).animate({ top: '+=' + conf.size }, 'slow');
    conf.target.append(newItem);
    (conf.rows + 1) * conf.columns + 1 === count && items.eq(0).remove();
  };


  AdminModerationController.prototype.moderated = function(item, data, featured) {
    item.unbind('mousedown').click(function() {
      return false;
    });
    var conf = featured ? this.widgets.featured : this.widgets.accepted;
    var size = item.width() - 20;
    var newItem = item.clone();
    var itemClass = featured ? 'featured' : 'accepted';
    item.addClass(itemClass).find('img').width(size).height(size);
    var items = $('a', conf.target);
    var count = items.length;
    var pos = count % conf.columns;
    if (!pos) {
      conf.target.append(newItem.css({ left: pos * conf.size, top: -conf.size }));
      items.add(newItem).stop(true, true).animate({ top: '+=' + conf.size }, 'slow');
    }
    else {
      conf.target.append(newItem.css({ left: pos * conf.size, top: 0 }));
    }
    conf.columns * conf.rows + 1 === count && items.filter(':lt(' + conf.columns + ')').remove();
    data.featured = featured;
    this.sigma.moderatedItem(this.id, data);
  };


  $(function() {
    var self = new AdminModerationController();
    self.init(self);
  });

})(jQuery);
