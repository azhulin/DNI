(function($) {

  $(function() {
    var sigma = new Sigma();
    if (!('host' in sigma)) {
      sigma = null;
    }

    var $status = $('#edit-status');
    var $start = $('#edit-node-start');
    var $stop = $('#edit-node-stop');
    if (sigma && $status.length) {
      $('#edit-status').show();
      sigma.ping(
        function() {
          $('.server-status', $status).hide();
          $('.server-status.server-status-on', $status).show();
          $stop.show();
        },
        function() {
          $('.server-status', $status).hide();
          $('.server-status.server-status-off', $status).show();
          $start.show();
        }
      );
    }
  });

})(jQuery);
