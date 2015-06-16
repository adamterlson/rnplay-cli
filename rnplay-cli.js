#!/usr/bin/env node --harmony_arrow_functions

cli = require("cli");
fs = require('fs');
expandHomeDir = require('expand-home-dir');
homedir = expandHomeDir('~');

cli.parse({
    authenticate:   ['a', 'Authenticate to rnplay.org with a token'],
    create:  ['c', 'Create a git remote for this application']
});


function readConfig() {

  return JSON.parse(fs.readFileSync(homedir+".rnplay"));
}

cli.main(function(args, options) {
    var server, middleware = [];

    if (options.authenticate) {
      this.output("Enter your authentication token:")
      cli.withInput(function (line, newline, eof) {
        config = JSON.stringify({token: line});

        fs.writeFile(homedir+"/.rnplay", config+"\n", function (err) {
          if (err) throw err;
          console.log("Saved authentication token to ~/.rnplay");
          process.exit();
        });
      });
    }
});
