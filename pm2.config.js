/**
 * app.config.js
 *
 * @see https://pm2.keymetrics.io/docs/usage/pm2-doc-single-page/
 * sobird<i@sobird.me> at 2020/10/21 12:26:31 created.
 */

module.exports = {
  apps: [{
    /** application name (default to script filename without extension) */
    name: 'mix',
    /** script path relative to pm2 start */
    script: 'standalone/server.js',
    // args: '-p 3000',
    /** the directory from which your app will be launched */
    // cwd: "",
    /** true by default. if false, PM2 will not restart your app if it crashes or ends peacefully */
    autorestart: true,
    /** enable watch & restart feature, if a file change in the folder or subfolder, your app will get reloaded */
    watch: false,
    /** Delay between restart */
    watch_delay: 1000,
    /** list of regex to ignore some file or folder names by the watch feature */
    ignore_watch: [
      'public',
      'node_modules',
    ],
    /**
     * PM2 is giving chokidar these Default options:
     * watch_options: {
     *   persistent    : true,
     *   ignoreInitial : true
     * }
     * @see https://github.com/paulmillr/chokidar#api
     */
    watch_options: {
      followSymlinks: false,
    },
    /** The interpreter used. */
    exec_interpreter: 'bash',
    /** alias to interpreter_args */
    // node_args: "--harmony",
    /**
     * 启用多少个实例，可用于负载均衡
     * 如果设为 0或者 max，则根据当前机器核数确定实例数目。
     */
    instances: 0,
    /** mode to start your app, can be “cluster” or “fork”, default fork */
    exec_mode: 'cluster_mode',

    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
  }],

  deploy: {
    production: {
      user: 'SSH_USERNAME',
      host: 'SSH_HOSTMACHINE',
      ref: 'origin/master',
      repo: 'GIT_REPOSITORY',
      path: 'DESTINATION_PATH',
      'pre-deploy-local': '',
      'post-deploy': 'npm install && pm2 reload ecosystem.config.js --env production',
      'pre-setup': '',
    },
  },
};
