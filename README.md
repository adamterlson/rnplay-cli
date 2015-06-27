# rnplay-cli
Command line interface for the React Native Playground.

Use it to setup your React Native apps to be pushed up to rnplay.org using git.

# Usage

## Authentication

Fetch your authentication token http://rnplay.org/users/edit.

Then run this command and enter your token. It's saved in ~/.rnplay

```
rnplay -a
```

## Setup an app for push

To create a record for your existing app on rnplay.org, and setup a git remote for it, run:

```
rnplay -c
```

Finally, push your app using git:

```
git push rnplay master
```

This command stores your app's new unique ID in .rnplay. You may want to .gitignore it.

## Opening the app

To open in the browser:

```
rnplay -o
```
