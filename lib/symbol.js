'use strict';

function Symbol(identifier) {
  this.identifier = identifier;
}

Symbol.prototype.toString = function() {
  return this.identifier;
};

module.exports = Symbol;
