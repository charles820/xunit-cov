
/**
 * Module dependencies.
 */

var Base = require('./base')
  , utils = require('../utils')
  , escape = utils.escape;

/**
 * Save timer references to avoid Sinon interfering (see GH-237).
 */

var Date = global.Date
  , setTimeout = global.setTimeout
  , setInterval = global.setInterval
  , clearTimeout = global.clearTimeout
  , clearInterval = global.clearInterval;

/**
 * Expose `XUnitCOV`.
 */

exports = module.exports = XUnitCOV;

/**
 * Initialize a new `XUnitCOV` reporter.
 *
 * @param {Runner} runner
 * @api public
 */

function XUnitCOV(runner) {
  Base.call(this, runner);
  var stats = this.stats
    , tests = []
    , self = this;

  runner.on('test end', function(test){
    tests.push(test);
  });

  runner.on('end', function(){
    var cov = global._$jscoverage || {};
    var result = self.cov = map(cov);
    
    console.log(tag('testsuite', {
        name: 'Mocha Tests'
      , tests: stats.tests
      , coverage: result.coverage
      , hits: result.hits
      , misses: result.misses
      , sloc: result.sloc
      , failures: stats.failures
      , errors: stats.failures
      , skip: stats.tests - stats.failures - stats.passes
      , timestamp: (new Date).toUTCString()
      , time: stats.duration / 1000
    }, false));

    for (var filename in cov) {
        var data = coverage(filename, cov[filename]);

        console.log(tag('test', {
            filename: filename
            , coverage: data.coverage
            , hits: data.hits
            , misses: data.misses
            , sloc: data.sloc
        }, false));
        console.log('</test>');
    }

    tests.forEach(test);
    console.log('</testsuite>');    
  });
}

/**
 * Map jscoverage data to a JSON structure
 * suitable for reporting.
 *
 * @param {Object} cov
 * @return {Object}
 * @api private
*/

function map(cov) {
  var ret = {
      instrumentation: 'node-jscoverage'
      , sloc: 0
      , hits: 0
      , misses: 0
      , coverage: 0
      , files: []
  };

  for (var filename in cov) {
      var data = coverage(filename, cov[filename]);
      
      ret.files.push(data);
      ret.hits += data.hits;
      ret.misses += data.misses;
      ret.sloc += data.sloc;
  }

  if (ret.sloc > 0) {
      ret.coverage = (ret.hits / ret.sloc) * 100;
  }

  return ret;
};

/**
 * Map jscoverage data for a single source file
 * to a JSON structure suitable for reporting.
 *
 * @param {String} filename name of the source file
 * @param {Object} data jscoverage coverage data
 * @return {Object}
 * @api private
*/

function coverage(filename, data) {
  var ret = {
      filename: filename,
      coverage: 0,
      hits: 0,
      misses: 0,
      sloc: 0,
      source: {}
  };

  data.source.forEach(function(line, num){
      num++;

      if (data[num] === 0) {
          ret.misses++;
          ret.sloc++;
      } else if (data[num] !== undefined) {
          ret.hits++;
          ret.sloc++;
      }

      ret.source[num] = {
          source: line
          , coverage: data[num] === undefined
          ? ''
          : data[num]
      };
  });

  ret.coverage = ret.hits / ret.sloc * 100;

  return ret;
}

/**
 * Inherit from `Base.prototype`.
 */

XUnitCOV.prototype.__proto__ = Base.prototype;

/**
 * Output tag for the given `test.`
 */

function test(test) {
  var attrs = {
      classname: test.parent.fullTitle()
    , name: test.title
    , time: test.duration / 1000
  };

  if ('failed' == test.state) {
    var err = test.err;
    attrs.message = escape(err.message);
    console.log(tag('testcase', attrs, false, tag('failure', attrs, false, cdata(err.stack))));
  } else if (test.pending) {
    console.log(tag('testcase', attrs, false, tag('skipped', {}, true)));
  } else {
    console.log(tag('testcase', attrs, true) );
  }
}

/**
 * HTML tag helper.
 */

function tag(name, attrs, close, content) {
  var end = close ? '/>' : '>'
    , pairs = []
    , tag;

  for (var key in attrs) {
    pairs.push(key + '="' + escape(attrs[key]) + '"');
  }

  tag = '<' + name + (pairs.length ? ' ' + pairs.join(' ') : '') + end;
  if (content) tag += content + '</' + name + end;
  return tag;
}

/**
 * Return cdata escaped CDATA `str`.
 */

function cdata(str) {
  return '<![CDATA[' + escape(str) + ']]>';
}

/**
 * Return a plain-object representation of `test`
 * free of cyclic properties etc.
 *
 * @param {Object} test
 * @return {Object}
 * @api private
*/

function clean(test) {
  return {
      title: test.title
      , fullTitle: test.fullTitle()
      , duration: test.duration
  }
}
