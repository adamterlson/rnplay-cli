#!/usr/bin/env node --harmony
'use strict';

/* jshint esnext: true, node:true, unused: true */

const EventEmitter = require('events').EventEmitter;
EventEmitter.defaultMaxListeners = 0;

const cli = require('cli');
const fs = require('fs');
const path = require('path');
const Promise = require('bluebird');
const expandHomeDir = require('expand-home-dir');
const exec = require('child_process').exec;

const HOMEDIR = expandHomeDir('~');
const CONFIG_FILE = '.rnplay';
const CONFIG_FILE_PATH = path.join(HOMEDIR, CONFIG_FILE);

const writeFileAsync = Promise.promisify(fs.writeFile, fs);
const readFileAsync = Promise.promisify(fs.readFile, fs);
const execAsync = Promise.promisify(exec);

const inputUtils = require('./utils/input');
const maybeUsePackageName =  inputUtils.maybeUsePackageName;
const readTokenFromCLI =  inputUtils.readTokenFromCLI;
const readRepoNameFromCLI =  inputUtils.readRepoNameFromCLI;
const readEmailFromCLI =  inputUtils.readEmailFromCLI;

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

const readConfig = () => {
  return readFileAsync(CONFIG_FILE_PATH)
  .then((contents) => {
    return JSON.parse(contents);
  })
  .catch((e) => {
    throw new Error('Missing or corrupt config file, please run `rnplay -a`');
  });
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
    const config = JSON.stringify({
      token: token,
      email: email
    }) + '\n';
    return writeFileAsync(CONFIG_FILE_PATH, config);
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
      cli.ok('All done! use `git push rnplay master` to push your application.');
    });
};

const actionMap = {
  authenticate: createConfig,
  create: createGitRepo
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
