#!/usr/bin/env node --harmony
'use strict';

/* jshint esnext: true, node:true, unused: true */

const EventEmitter = require('events').EventEmitter;
EventEmitter.defaultMaxListeners = 0;

const cli = require('cli');
const exec = require('child_process').exec;
const opener = require('opener');

const Promise = require('bluebird');
const RN_PLAY_APP_URL = 'https://staging.rnplay.org/apps/';

const execAsync = Promise.promisify(exec);

const inputUtils = require('./utils/input');
const maybeUsePackageName =  inputUtils.maybeUsePackageName;
const readTokenFromCLI =  inputUtils.readTokenFromCLI;
const readRepoNameFromCLI =  inputUtils.readRepoNameFromCLI;
const readEmailFromCLI =  inputUtils.readEmailFromCLI;

const configUtils = require('./utils/config');
const readConfig =  configUtils.readConfig;
const saveConfig =  configUtils.saveConfig;
const saveLocalConfig =  configUtils.saveLocalConfig;
const readLocalConfig =  configUtils.readLocalConfig;

const api = require('./utils/api');

cli.parse({
  authenticate: ['a', 'Authenticate to rnplay.org with a token'],
  create:       ['c', 'Create a git remote for this application'],
  open:         ['o', 'Opens the last created application in rnplay.org']
});

/**
 * Returns the key of the first item, which has a truthy value
 * @param  {object} options The cli options
 * @return {string}         The key
 */
const getFirstTrueOption = (options) => {
  return Object.keys(options).reduce((prev, key) => {
    return prev ?
      prev :
      options[key] && key;
  }, null);
};

/**
 * Reads auth token and email from stdin and writes them to the config file
 * @return {Object} A promise
 */
const createConfig = () => {
  return readTokenFromCLI()
  .then((token) => {
    return readEmailFromCLI()
    .then((email) => {
      return [token, email];
    });
  })
  .spread((token, email) => {
    return saveConfig({
      token: token,
      email: email
    });
  })
  .then(() => {
    cli.ok('Saved config to ~/.rnplay');
  });
};

/**
 * Creates a git repo with a name provided by the user and then
 * adds a remove to the local git repo.
 * @return {Object} A promise
 */
const createGitRepo = () => {
  var config;
  return readConfig()
    .then((conf) => {
      if (!conf.email || !conf.token) {
        throw new Error ('Invalid config, please run `rnplay -a` first');
      }
      config = conf;
    })
    .then(maybeUsePackageName)
    .then((name) => name ? name : readRepoNameFromCLI())
    .then((name) => {
      return api.postCreateRepo(name, config)
      .then((result) => result.body.url_token);
    })
    .then((urlToken) => {
      return saveLocalConfig({
        urlToken: urlToken
      })
      .then(() => urlToken);
    })
    .then((urlToken) => {
      cli.info('Adding git remote');
      var remoteName = 'rnplay';
      var url = 'https://'+ config.token + ':@git.rnplay.org:jsierles/' + urlToken + '.git';
      var cmd = 'git remote add ' + remoteName + ' ' + url;
      return execAsync(cmd)
        .then(() => {
          return [remoteName, url];
        });
    })
    .spread((remoteName, url) => {
      cli.ok('Added remote with name `' + remoteName + ' and url: `' + url +'`');
      cli.ok('All done! Use `git push rnplay master` to push your application.');
      cli.ok('You can use  `rnplay-cli --open` to open this application on rnplay.org');
    });
};

/**
 * Opens the current repo in the browser
 * @return {object} A promise
 */
const openAppInBrowser = () => {
  return readLocalConfig()
    .then((conf) => {
      const token = conf.urlToken;
      if (!token) {
        return cli.error('You have to create an application using `rnplay-cli --create` first');
      }

      const url = RN_PLAY_APP_URL + token;
      opener(url);
    });
}

const actionMap = {
  authenticate: createConfig,
  create: createGitRepo,
  open: openAppInBrowser
};

cli.main((args, options) => {
  const action = actionMap[getFirstTrueOption(options)];

  if (!action) {
    cli.getUsage();
    return;
  }

  action(cli)
  .catch((e) => {
    cli.error('Ooops, there has been an error: \n' + e.message);
    cli.info('If you are sure that you did nothing wrong, please file an issue at the rnplay-cli repo!');
  }).finally((e) => process.exit());
});
