var crypto = require('crypto');

module.exports = AccessCard;


function AccessCard(options) {
  options = options || {};
  this.salt = 'salt' in options ? options.salt : '';
  this.lifeTime = 'lifeTime' in options ? options.lifeTime : 300;
}


AccessCard.prototype.create = function(card) {
  card.expires = new Date().getTime() + this.lifeTime;
  card = new Buffer(encode(JSON.stringify(card)), 'binary').toString('base64');

  return card;
};


AccessCard.prototype.validate = function(card) {
  if (!card) {
    return false;
  }
  card = JSON.parse(encode(new Buffer(card, 'base64').toString('binary')));
  if (card
      && 'role' in card && card.role
      && 'path' in card && card.path
      && 'expires' in card && card.expires > new Date().getTime()) {
    delete card.expires;
    return card;
  }
  else {
    return false;
  }
};


function encode(card) {
  var length = card.length;
  var gamma = '';
  while (gamma.length < length) {
    var shasum = crypto.createHash('sha1');
    var seq = shasum.update(gamma + this.salt).digest('hex');
    gamma += seq.substr(0, 8);
  }

  var result = '';
  for (var i = 0; i < card.length && i < gamma.length; ++i) {
    result += String.fromCharCode(card.charCodeAt(i) ^ gamma.charCodeAt(i));
  }

  return result;
}
