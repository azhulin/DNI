(function($) {

  function WidgetController() {
    var self = this;
    this.widgets = {};
    this.data = {};
    $('.sigma-widget').each(function() {
      var id = $(this).attr('sigma-subsid');
      if (!(id in self.widgets)) {
        self.widgets[id] = [];
        self.data[id] = 0;
      }
      var conf = {
        target: $(this),
        size: +$(this).attr('sigma-size'),
        columns: +$(this).attr('sigma-columns'),
        rows: +$(this).attr('sigma-rows'),
        animation: $(this).attr('sigma-animation')
      };
      if ('horizontal' === conf.animation) {
        conf.pos = conf.rows;
      }
      else {
        conf.pos = conf.columns;
      }
      self.widgets[id].push(conf);
      var count = conf.columns * conf.rows;
      count > self.data[id] && (self.data[id] = count);
      $('.sigma-content', this).css({
        borderColor: $(this).attr('sigma-color'),
        height: conf.size * conf.rows,
        width: conf.size * conf.columns
      });
    });
    console.log(this.widgets);
  }


  WidgetController.prototype.init = function(object) {
    var group = 'client';
    this.sigma = new Sigma({
      group: group,
      subscriptions: this.data,
      callbacks: {
        aOnline: {
          success: function(data) {
            object.isOnline(data);
          }
        },
        aExit: {
          success: function(data) {
            object.isOffline(data);
          }
        },
        aBadSubscription: {
          success: function(data) {
            object.badSubscription(data);
          }
        },
        aUpdate: {
          success: function(data) {
            object.update(data);
          }
        }
      }
    }).init();
  };


  WidgetController.prototype.isOnline = function() {
    console.log('Server online');
    $('.pane-ig-widget').show();
  };


  WidgetController.prototype.isOffline = function() {
    console.log('Server offline');
  };


  WidgetController.prototype.badSubscription = function(data) {
    console.log('Bad Subscription');
    data.id in this.widgets && this.widgets[data.id].forEach(function(widget) {
      widget.remove();
    });
    delete this.widgets[data.id];
  };

  WidgetController.prototype.update = function(data) {
    console.log(data);
    var self = this;
    var widgets = this.widgets[data.id];
    widgets.forEach(function(conf) {
      data.data.forEach(function(item) {
        switch (conf.animation) {
          case 'horizontal':
            self.animateHorizontal(conf, item);
            break;

          case 'vertical':
            self.animateVertical(conf, item);
            break;

          case 'random':
            self.animateRandom(conf, item);
            break;
        }
      });
    });
  };


  WidgetController.prototype.animateHorizontal = function(conf, item) {
    var items = $('.sigma-content a', conf.target);
    var count = items.length;
    !conf.pos-- && (conf.pos = conf.rows - 1);
    var x = -conf.size;
    var y = conf.pos * conf.size;
    var newItem = $('<a href="' + item.link + '" class="sigma-image" target="_blank">'
        + '<img width="' + conf.size + '" height="' + conf.size + '" src="' + item.images.thumbnail + '"/>'
        + '<span class="sigma-user">' + item.user + '</span></a>')
      .css({ left: x, top: y });
    conf.target.find('.sigma-content').append(newItem);
    !y && items.add(newItem).stop(true, true).animate({ left: '+=' + conf.size }, 'slow');
    (conf.columns + 1) * conf.rows + 1 === count && items.eq(0).remove();
  };


  WidgetController.prototype.animateVertical = function(conf, item) {
    var items = $('.sigma-content a', conf.target);
    var count = items.length;
    !conf.pos-- && (conf.pos = conf.columns - 1);
    var x = conf.pos * conf.size;
    var y = -conf.size;
    var newItem = $('<a href="' + item.link + '" class="sigma-image" target="_blank">'
        + '<img width="' + conf.size + '" height="' + conf.size + '" src="' + item.images.thumbnail + '"/>'
        + '<span class="sigma-user">' + item.user + '</span></a>')
      .css({ left: x, top: y });
    conf.target.find('.sigma-content').append(newItem);
    !x && items.add(newItem).stop(true, true).animate({ top: '+=' + conf.size }, 'slow');
    (conf.rows + 1) * conf.columns + 1 === count && items.eq(0).remove();
  };


  WidgetController.prototype.animateRandom = function(conf, item) {
    var items = $('.sigma-content a', conf.target);
    var count = items.length;

    if (conf.columns * conf.rows > count) {
      !conf.pos-- && (conf.pos = conf.columns - 1);
      var x = conf.pos * conf.size;
      var y = -conf.size;
      var newItem = $('<a href="' + item.link + '" class="sigma-image" target="_blank">'
          + '<img width="' + conf.size + '" height="' + conf.size + '" src="' + item.images.thumbnail + '"/>'
          + '<span class="sigma-user">' + item.user + '</span></a>')
        .css({ left: x, top: y });
      conf.target.find('.sigma-content').append(newItem);
      !x && items.add(newItem).stop(true, true).animate({ top: '+=' + conf.size }, 0);
    }
    else {
      var rand = Math.floor(Math.random() * (conf.columns * conf.rows + 1));
      console.log(rand);
    }
  };


  $(function() {
    var self = new WidgetController();
    self.init(self);
  });

})(jQuery);
