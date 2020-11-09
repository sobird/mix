/**
 * The streaming build system based on Middleware.
 * 
 * sobird<i@sobird.me> at 2020/07/30 21:33:57 created.
 */

'use strict';

module.exports = class Mix extends EventEmitter {
  constructor(options = {}) {
    super();
    this.state = {};
    this.output = './output';
  }
}
