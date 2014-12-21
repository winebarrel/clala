#!/usr/bin/env node --harmony
'use strict';
var Procedure = require('./procedure.js');
var Env = require('./env.js');

function Procedure(parms, body, env) {
  this.parms = parms;
  this.body = body;
  this.env = env;
}

Procedure.prototype.apply = function(thisArg, args) {
  return evaluate(this.body, new Env(this.parms, args, this.env));
}

function evaluate(x, env) {
  if (typeof(x) == 'object' && x.hasOwnProperty('identifier')) {
    return env.find(x).get(x);
  } else if (!(x instanceof Array) || x.length == 0) {
    return x;
  } else {
    switch (x[0].toString()) {
      case 'quote':
        return x[1];
      case 'if':
        var test = x[1], conseq = x[2], alt = x[3];
        var exp = null;

        if (evaluate(test, env)) {
          exp = conseq;
        } else {
          exp = alt;
        }

        return evaluate(exp, env);
      case 'while':
        var test = x[1], exp = x[2];

        while (evaluate(test, env)) {
          evaluate(exp, env)();
        }

        break;
      case 'define':
        var name = x[1], exp = x[2];
        env.set(name, evaluate(exp, env));
        break;
      case 'set!':
        var name = x[1], exp = x[2];
        env.find(name).set(name, evaluate(exp, env));
        break;
      case 'lambda':
        var parms = x[1], body = x[2];
        var proc = new Procedure(parms, body, env);
        return proc;
      default:
        var func_or_obj = evaluate(x[0], env);

        if (func_or_obj instanceof Function || func_or_obj instanceof Procedure) {
          var args = x.slice(1).map(function(exp) { return evaluate(exp, env); });
          return func_or_obj.apply(null, args);
        } else if (x.length > 2) {
          return func_or_obj[x[1].toString()].apply(func_or_obj, x.slice(2));
        } else {
          return func_or_obj[x[1].toString()];
        }
    }
  }
}

module.exports = evaluate;
