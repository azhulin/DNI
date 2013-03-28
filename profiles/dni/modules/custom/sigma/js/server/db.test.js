var mysql      = require('mysql');
var connection = mysql.createConnection({
  host     : 'localhost',
  user     : 'root',
  database : 'dni'
});

connection.connect();

connection.query('SELECT * FROM users', function(err, rows, fields) {
  if (err) throw err;

  console.log(rows);
});

connection.end();




/*mysql           = require('mysql');
mysql_pool  = mysql.createPool(config.mysql);

mysql_pool.getConnection(function(err, db) {
    if (!err) {
        db.query("INSERT IGNORE INTO " + config.ott.tables.hotel_childs + " SET ?", {
            hotel_id: candidate.id,
            child_id: hotel.id,
            gate    : hotel.gate
        }, function(err, data) {
            db.destroy();
        });
    }
});


db.execute = function () {
 var cb = Array.prototype.splice.call(arguments, arguments.length - 1, 1)[0];
 var args = Array.prototype.splice.call(arguments, 0, arguments.length);

 mysql_pool.getConnection(function (err, db) {
  if (!err) {
   args.push(function (err, res) {
    db.destroy();
    cb(err, res);
   });
   db.query.apply(db, args);
  } else {
   cb(err);
  }
 });
};*/