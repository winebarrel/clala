function Env(parms, args, outer) {
  this.hash = {};
  this.outer = outer;

  parms = parms || [];
  args  = args  || [];

  for (var i = 0; i < parms.length; i++) {
    this.hash[parms[i].toString()] = args[i];
  }

  this.get = function(name) {
    return this.hash[name.toString()];
  };

  this.set = function(name, val) {
    this.hash[name.toString()] = val;
  };

  this.find = function(name) {
    name = name.toString();

    if (this.hash[name] != null && this.hash[name] != undefined) {
      return this;
    } else if(this.outer) {
      return this.outer.find(name);
    } else {
      throw new Error('unbound variable: ' + name)
    }
  };
}

module.exports = Env;
