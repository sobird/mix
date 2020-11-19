/**
 * index.js
 *
 * sobird<i@sobird.me> at 2020/11/18 11:40:12 created.
 */

const { Readable, Writable } = require('stream');
const glob = require('glob');

module.exports = function (pattern = '**/*', options, streamOptions) {
  const readable = Readable(
    Object.assign(
      {
        objectMode: true,
      },
      streamOptions
    )
  );

  const globber = glob(
    pattern,
    Object.assign(
      {
        nodir: true,
        absolute: true,
      },
      options
    ),
    (err, files) => {
      //console.log(files);
    }
  );

  globber.on('match', function (path) {
    if (
      !readable.push({
        path,
        cwd: globber.cwd,
      })
    ) {
      this.pause();
    }
  });

  globber.once('end', function () {
    readable.push(null);
  });

  readable._read = function () {
    globber.resume();
  };

  readable._destroy = function () {
    globber.abort();

    process.nextTick(() => {
      if (err) {
        this.emit('error', err);
      }
      this.emit('close');
    });
  };

  return readable;
};
