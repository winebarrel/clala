function Procedure(parms, body, env) {
  this.parms = parms;
  this.body = body;
  this.env = env;
}

Procedure.prototype.apply = function(thisArg, args) {
  return evaluate(this.body, new Env(this.parms, args, this.env));
}

module.exports = Procedure;
