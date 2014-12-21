'use strict';
var Parser = require('./parser.js');
var evaluate = require('./evaluate.js');
var Env = require('./env.js');
var Lambda = require('./lambda')

var readline = require('readline');
var util = require('util');

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
  env.set('print'     , function(x) { console.log(x); });
  env.set('eval-js'   , function(x) { return eval(x.toString()); });
  env.set('require'   , function(x) { return require(x.toString()); });
  env.set('for-each'  , function(f, x) { x.forEach(function(i) { f.apply(null, [i]); }); });
  env.set('exit'      , function(x) { Lambda.cleanup(function() { process.exit(x || 0); }) });

  return env;
}

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

      if (typeof(parsed) == 'object' && parsed.hasOwnProperty('identifier')) {
        print_lispstr(evaluate(parsed, this.global_env));
      } else if (parsed instanceof Array) {
        parsed.forEach(function(list) {
          print_lispstr(evaluate(list, this.global_env));
        }.bind(this));
      } else {
        print_lispstr(parsed);
      }
    } catch (e) {
      console.log(e.stack ? e.stack : e);
    }

    rl.prompt();
  }.bind(this)).on('close', function() {
    console.log('\ncleaning...');

    Lambda.cleanup(function() {
      process.exit(0);
    });
  }.bind(this));;

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
