/**
 * File
 * 
 * @see https://github.com/gulpjs/vinyl/blob/master/index.js
 * @see https://github.com/fex-team/fis3/blob/master/lib/file.js
 * 
 * sobird<i@sobird.me> at 2020/11/09 16:06:30 created.
 */

const path = require('path');

class File {
  constructor(file = {}) {
    this.path = file.path;

    this.cwd = file.cwd || process.cwd();
    this.base = file.base;
    this.content = file.content || null;
    this.stat = file.stat || null;
  }

  clone() {
    // todo
  }

  isBuffer() {
    return Buffer.isBuffer(this.content);
  }

  isStream() {
    return this.content && (typeof this.content.pipe == 'function');
  }

  isNull() {
    return this.content == null;
  }

  /**
   * pseudo-properties
   * 
   * {
   *   content,
   *   path,
   *   cwd,
   *   base,
   *   name,
   *   relative,
   *   dirname,
   *   basename,
   *   extname,
   * }
   */
  get content() {
    return this._content;
  }
  set content(value) {
    this._content = value;
  }

  get path() {
    return path.normalize(path.format(this._path));
  }
  set path(value) {
    this._path = path.parse(value);
  }

  get cwd() {
    return this._cwd;
  }
  set cwd(value) {
    this._cwd = path.normalize(value);
  }

  get base() {
    return this._base || this._cwd;
  }
  set base(value) {
    if (base == null) {
      delete this._base;
      return;
    }

    this._base = path.normalize(value);
  }

  get name() {
    return this._path.name;
  }
  set name(name) {
    this._path.name = name;
  }

  get relative() {
    return path.relative(this.base, this.path);
  }
  set relative() {
    // nothing todo
  }

  get dirname() {
    return this._path.dir;
  }
  set dirname(dirname) {
    this._path.dir = dirname;
  }

  get basename() {
    return this._path.base;
  }
  set basename(basename) {
    let _path = path.parse(basename);

    this._path.base = basename;
    this._path.name = _path.name;
    this._path.ext = _path.ext;
  }

  get extname() {
    return this._path.ext;
  }
  set extname(ext) {
    ext.slice(0, 1) != '.' && (ext = '.' + ext);
    this._path.ext = ext;
  }
}

module.exports = File;
