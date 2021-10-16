/**
 * read file content
 * through stream
 *
 * sobird<i@sobird.me> at 2020/11/23 17:22:25 created.
 */

const through2 = require('through2');

module.exports = function () {
  return through2.obj(function (chunk, enc, next) {});
};
