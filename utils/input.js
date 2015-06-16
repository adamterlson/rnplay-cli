'use strict';

/* jshint esnext: true, node:true */

const cli = require('cli');
const Promise = require('bluebird');
const val = require('validator');
const path = require('path');

const withInputAsync = () => {
  return new Promise((resolve, reject) => {
    cli.withInput((line) =>{
      resolve(line);
    });
  });
};

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

const maybeUsePackageName = () => {
  var name;
  try {
    name = require(path.join(process.cwd(), 'package.json')).name;
  } catch (e) {}

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
}

module.exports = {
  maybeUsePackageName: maybeUsePackageName,
  withInputAsync: withInputAsync,
  readTokenFromCLI: readTokenFromCLI,
  readRepoNameFromCLI: readRepoNameFromCLI,
  readEmailFromCLI: readEmailFromCLI
};
