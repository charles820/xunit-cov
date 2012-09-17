# Mocha Xunit-cov Reporter

## xunit-cov

The XunitCov reporter is similar to the xunit reporter, however when run against a library instrumented by node-jscoverage it will produce coverage output.

## How to use
* Add "xunit-cov" to your package.json as a developmentDependency
* Run mocha with -R xunit-cov or --reporter xunit-cov

## Credits
This reporter is just the original [xunit reporter](https://github.com/visionmedia/mocha/blob/master/lib/reporters/xunit.js) from mocha.
