#!/usr/bin/env node --harmony
'use strict';
var Parser = require('./parser.js');
var Symbol = require('./symbol.js');

var readline = require('readline');
var util = require('util');

function Env(parms, args, outer) {
  this.hash = {};
  this.outer = outer;

  parms = parms || [];
  args  = args  || [];

  for (var i = 0; i < parms.length; i++) {
    this.hash[parms[i].toString()] = args[i];
  }
}

Env.prototype.get = function(name) {
  return this.hash[name.toString()];
};

Env.prototype.set = function(name, val) {
  this.hash[name.toString()] = val;
};

Env.prototype.find = function(name) {
  name = name.toString();

  if (this.hash[name]) {
    return this;
  } else if(this.outer) {
    return this.outer.find(name);
  } else {
    throw new Error('unbound variable: ' + name)
  }
}


function Client() {}

Client.prototype.parse = function(program) {
  return Parser.parse(program);
}

Client.prototype.standard_env = function() {
  var env = new Env;

  env.set('>' , function(x, y) { return x >  y; });
  env.set('>=', function(x, y) { return x >= y; });
  env.set('<' , function(x, y) { return x <  y; });
  env.set('<=', function(x, y) { return x <= y; });
  env.set('=' , function(x, y) { return x == y; });

  env.set('+', function() { return Array.prototype.slice.call(arguments).reduce(function(r, i) { return r + i; }); });
  env.set('-', function() { return Array.prototype.slice.call(arguments).reduce(function(r, i) { return r - i; }); });
  env.set('*', function() { return Array.prototype.slice.call(arguments).reduce(function(r, i) { return r * i; }); });
  env.set('/', function() { return Array.prototype.slice.call(arguments).reduce(function(r, i) { return r / i; }); });

  env.set('apply'     , function(f) { return f.apply(null, Array.prototype.slice.call(arguments, 1)); });
  env.set('begin'     , function() { var a = Array.prototype.slice.call(arguments); return a[a.length - 1]; });
  env.set('car'       , function(x) { return x[0]; });
  env.set('cdr'       , function(x) { return x.slice(1, x.length); });
  env.set('cons'      , function(x, y) { y = y.slice(); y.unshift(x); return y; });
  env.set('eq?'       , function(x, y) { return x == y; });
  env.set('equal?'    , function(x, y) { return x == y; });
  env.set('length'    , function(x) { return x.length; });
  env.set('list'      , function() { return Array.prototype.slice.call(arguments); });
  env.set('list?'     , function(x) { return x instanceof Array; });
  env.set('map'       , function(f, x) { return x.map(function(i) { return f(i); }); });
  env.set('not'       , function(x) { return !x; });
  env.set('null?'     , function(x) { return x.length == 0; });
  env.set('number?'   , function(x) { return typeof(x) == 'number'; });
  env.set('print'     , function(x) { console.log(this.lispstr(x)); }.bind(this));
  env.set('procedure?', function(x) { return x instanceof Function; });
  env.set('symbol?'   , function(x) { return x instanceof Symbol; });
  env.set('eval-js'   , function(x) { return eval(x.toString()); });
  env.set('require'   , function(x) { return require(x.toString()); });

  return env;
}

Client.prototype.create_procedure = function(parms, body, env) {
  return function() {
    var args = Array.prototype.slice.call(arguments);
    return this.evaluate(body, new Env(parms, args, env));
  }.bind(this);
}

Client.prototype.evaluate = function(x, env) {
  env = env || this.global_env;

  if (x instanceof Symbol) {
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

        if (this.evaluate(test, env)) {
          exp = conseq;
        } else {
          exp = alt;
        }

        return this.evaluate(exp, env);
      case 'define':
        var name = x[1], exp = x[2];
        env.set(name, this.evaluate(exp, env));
        break;
      case 'set!':
        var name = x[1], exp = x[2];
        env.find(name).set(name) = this.evaluate(exp, env);
        break;
      case 'lambda':
        var parms = x[1], body = x[2];
        return this.create_procedure(parms, body, env);
      default:
        var func_or_obj = this.evaluate(x[0], env);

        if (func_or_obj instanceof Function) {
          var args = x.slice(1).map(function(exp) { return this.evaluate(exp, env); }.bind(this));
          return func_or_obj.apply(null, args);
        } else if (x.length > 2) {
          return func_or_obj[x[1].toString()].apply(func_or_obj, x.slice(2));
        } else {
          return func_or_obj[x[1].toString()];
        }
    }
  }
};

Client.prototype.global_env = Client.prototype.standard_env();

Client.prototype.repl = function(prompt) {
  prompt = prompt || 'clala> ';
  var rl = readline.createInterface(process.stdin, process.stdout);
  rl.setPrompt(prompt);

  rl.on('line', function(line) {
    var print_lispstr = function print_lispstr(value) {
      if (value != undefined) {
        value = this.lispstr(value);
        console.log(value);
      }
    }.bind(this);

    try {
      var parsed = this.parse(line);

      if (parsed instanceof Symbol) {
        print_lispstr(this.evaluate(parsed));
      } else if (parsed instanceof Array) {
        parsed.forEach(function(list) {
          print_lispstr(this.evaluate(list));
        }.bind(this));
      } else {
        print_lispstr(parsed);
      }
    } catch (e) {
      if (e.message) {
        console.log(e.message);
      } else {
        console.log(e.message);
      }

      if (e.stack) {
        console.log(e.stack);
      }
    }

    rl.prompt();
  }.bind(this));

  rl.prompt();
}

Client.prototype.lispstr = function(exp) {
  if (exp instanceof Array) {
    return '(' + exp.map(function(i) { return this.lispstr(i) }.bind(this)).join(' ') + ')';
  } else {
    return util.inspect(exp);
  }
}

module.exports = Client;
