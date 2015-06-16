#!/usr/bin/env node --harmony

const EventEmitter = require('events').EventEmitter;
EventEmitter.defaultMaxListeners = 0;

const cli = require('cli');
const fs = require('fs');
const path = require('path');
const Promise = require('bluebird');
const val = require('validator');
const expandHomeDir = require('expand-home-dir');
const HOMEDIR = expandHomeDir('~');

const CONFIG_FILE = '.rnplay';
const CONFIG_FILE_PATH = path.join(HOMEDIR, CONFIG_FILE);

const withInputAsync = () => {
  return new Promise((resolve, reject) => {
    cli.withInput((line) =>{
      resolve(line);
    });
  });
};

const writeFileAsync = Promise.promisify(fs.writeFile, fs);

/**
 * Reads a single line, compares it with `predicate`
 * and either outputs and error message and waits for more
 * input or resolves the promise with the valid value
 * @param  {function} predicate The predicate to use for input checking
 * @param  {string} errorMsg    The error message to show
 * @return {object}             A promise
 */
const readLine = (predicate, errorMsg) => {
  return withInputAsync().then((input) => {
    if (!predicate(input)) {
      cli.output(errorMsg);
      return readLine(predicate, errorMsg);
    }

    return input.trim();
  });
};

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
  return JSON.parse(fs.readFileSync(CONFIG_FILE_PATH));
};

const readTokenFromCLI = () => {
  cli.output('Enter your authentication token:');
  return readLine(
    (token) => val.isLength(token, 1),
    'Please enter a valid authentication token'
  );
};

const readRepoNameFromCLI = () => {
  cli.output('Please enter a name for your git repository (min 5 characters):');
  return readLine(
    (input) => val.isLength(input, 5),
    'Please use a minimum of 5 characters'
  );
};

const readEmailFromCLI = () => {
  cli.output('Please enter your e-mail address:');
  return readLine(
    (input) => val.isEmail(input),
    'Please use a valid e-mail address'
  );
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
    })
  })
  .spread((token, email) => {
    const config = JSON.stringify({
      token: token,
      email: email
    }) + '\n';
    return writeFileAsync(CONFIG_FILE_PATH, config);
  })
  .then(() => {
    cli.output('Saved config to ~/.rnplay');
  });
};

/**
 * Creates a git repo with a name provided by the user and then
 * adds a remove to the local git repo.
 * @return {Object} A promise
 */
const createGitRepo = () => {
  var name;
  try {
    name = require(path.join(process.cwd(), 'package.json')).name;
  } catch (e) {}

  return Promise.resolve(name)
  .then((name) => {
    if (name) {
      cli.output('We found the following project name: ' + name + ' - do you want to use it? y/n');
      return readLine((input) => {
        input = input.trim().toLowerCase();
        return input === 'y' || input === 'n';
      }, 'Please answer with "y" or "n"')
      .then((answer) => {
        return answer === 'y' ?
          name :
          void 0;
      });
    }
  })
  .then((name) => {
    return name ?
      name :
      readRepoNameFromCLI();
  })
  .then((name) => {
    cli.output('Setting up new git repo')
    cli.output('Add git remote');
  })
  .finally(() => {
    process.exit();
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

  action(cli).finally(() => process.exit());
});
