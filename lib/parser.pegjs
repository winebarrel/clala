{
  'use strict';
  var Symbol = require('./symbol');
}

start
  = value
  / list*

list
  = _ "(" _ values:values?  _ ")" _
    {
      return values ? values : [];
    }

values
  = _ head:value_or_list tail:(_ value_or_list)* _ {
      return [].concat.apply([head], tail).filter(function(value) {
        return value;
      });
    }

value_or_list
  = value
  / list

value
  = number
  / string
  / symbol

number
  = number:$([+-]? [1-9][0-9]* ("." [0-9]+)?)
    {
      return parseFloat(number);
    }

symbol
  = symbol:$([^ \t\r\n()]+)
    {
      return new Symbol(symbol);
    }

string
  = string:($('"' [^"]* '"') / $("'" [^']* "'"))
    {
      return eval(string);
    }
_
  = ws* { return null; }

__
  = ws+ { return null; }

ws
  = [ \t\r\n]
