(function($) {

  function WidgetController() {
    var self = this;
    this.widgets = {};
    this.data = {};
    this.slowAnimSpeed = 2400;
    $('.sigma-widget').each(function() {
      var id = $(this).attr('sigma-subsid');
      if (!(id in self.widgets)) {
        self.widgets[id] = [];
        self.data[id] = 0;
      }
      var conf = {
        target: $(this).find('.sigma-content'),
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
      var color = $(this).attr('sigma-color');
      $('.sigma-content', this).css({
        backgroundColor: color,
        borderColor: color,
        height: conf.size * conf.rows,
        width: conf.size * conf.columns
      });
    });
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
    $('.pane-ig-widget').fadeIn(this.slowAnimSpeed);
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


  WidgetController.prototype.newItem = function(conf, item) {
    if (150 >= conf.size) {
      var src = item.images.thumbnail;
    }
    else if (306 < conf.size) {
      src = item.images.standard_resolution;
    }
    else {
      src = item.images.low_resolution;
    }
    var newItem = $('<a href="' + item.link + '" class="sigma-image" target="_blank">'
      + '<img width="' + conf.size + '" height="' + conf.size + '" src="' + src + '"/></a>');
    return newItem;
  };


  WidgetController.prototype.animateHorizontal = function(conf, item) {
    var items = $('a', conf.target);
    var count = items.length;
    !conf.pos-- && (conf.pos = conf.rows - 1);
    var y = conf.pos * conf.size;
    var newItem = this.newItem(conf, item)
      .css({ left: -conf.size, top: y });
    conf.target.append(newItem);
    !y && items.add(newItem).stop(true, true).animate({ left: '+=' + conf.size }, 'slow');
    (conf.columns + 1) * conf.rows + 1 === count && items.eq(0).remove();
  };


  WidgetController.prototype.animateVertical = function(conf, item) {
    var items = $('a', conf.target);
    var count = items.length;
    !conf.pos-- && (conf.pos = conf.columns - 1);
    var x = conf.pos * conf.size;
    var newItem = this.newItem(conf, item)
      .css({ left: x, top: -conf.size });
    conf.target.append(newItem);
    !x && items.add(newItem).stop(true, true).animate({ top: '+=' + conf.size }, 'slow');
    (conf.rows + 1) * conf.columns + 1 === count && items.eq(0).remove();
  };


  WidgetController.prototype.animateRandom = function(conf, item) {
    var items = $('a', conf.target);
    var count = items.length;
    var newItem = this.newItem(conf, item);
    if (conf.columns * conf.rows > count) {
      var x = count % conf.columns * conf.size;
      var y = Math.floor(count / conf.columns) * conf.size;
      conf.target.append(newItem.css({ left: x, top: y }));
    }
    else {
      var target = items.not(':animated');
      target = target.eq(Math.floor(Math.random() * target.length));
      var pos = target.position();
      newItem.hide().css({ left: pos.left, top: pos.top })
        .insertAfter(target)
        .fadeIn(this.slowAnimSpeed);
      target.fadeOut(this.slowAnimSpeed, function() {
        $(this).remove();
      });
    }
  };


  $(function() {
    var self = new WidgetController();
    self.init(self);
  });

})(jQuery);
