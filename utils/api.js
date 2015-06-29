'use strict';

/* jshint esnext: true, node:true, unused: true */

const cli = require('cli');
const request = require('superagent-bluebird-promise');

module.exports = (urlPrefix) => {
  const APP_ENDPOINT = 'https://' + urlPrefix + 'rnplay.org/apps.json';

  const postCreateRepo = (name, config) => {
    cli.info('Setting up new git repo');
    return request
      .post(APP_ENDPOINT)
      .set('Content-Type', 'application/json')
      .send(JSON.stringify({app: {name: name, uses_git: 1}}))
      .set('X-User-Email', config.email)
      .set('X-User-Token', config.token);
  };

  return {
    postCreateRepo: postCreateRepo
  };
};
