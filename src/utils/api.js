'use strict';

/* jshint esnext: true, node:true, unused: true */

import cli from 'cli';
import request from 'superagent-bluebird-promise';

export default (urlPrefix) => {
  const APP_ENDPOINT = `https://${urlPrefix}rnplay.org/apps.json`;

  const postCreateRepo = (name, { email, token }) => {
    cli.info('Setting up new git repo');
    return request
      .post(APP_ENDPOINT)
      .set('Content-Type', 'application/json')
      .send(JSON.stringify({app: {name, uses_git: 1}}))
      .set('X-User-Email', email)
      .set('X-User-Token', token);
  };

  return {
    postCreateRepo
  };
};
