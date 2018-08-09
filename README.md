
# Restaurant Reviews

## Overview

I completed this for the [Udacity Mobile Web Specialist Certification Course](https://www.udacity.com/course/mobile-web-specialist-nanodegree--nd024). This commit represents **stage 2** of the course. The objective is to convert [this static webpage](https://github.com/udacity/mws-restaurant-stage-1) to a responsive, mobile-ready web application which is in compliance with accepted accessibility standards and functional during limited or no internet connectivity.

### Requirements

* Development requires [Grunt](https://gruntjs.com/), [Gulp](https://gulpjs.com/), [Browserify](http://browserify.org/#install), [ESLint](https://eslint.org/docs/user-guide/getting-started) and [sailsjs](https://sailsjs.com/get-started). In a terminal, run these to install:
  * Grunt: `npm install -g grunt-cli`
  * Gulp: `npm install -g gulp-cli`
  * Browserify: `npm install -g browserify`
  * ESLint: `npm install -g eslint`
  * sailsjs: `npm install sails -g`

### API Setup
* In a terminal `cd` to a directory where you want to install the API.
* Run `git clone https://github.com/tdnelson2/mws-restaurant-stage-2-api.git`
* `cd` into the API directory and run `npm install`
* Run `node server` to start the API on port 1337.
* Leave the API running during all development.

### Project Setup
* In a new terminal window, clone this repo to your machine.
* `cd` into the project directory.
* Run `npm install`.
* Run `grunt` to build the responsive images.

### Development
* With the API running, run `gulp` in the project directory. The page should automatically launch in your default browser. Modifying the `html`, `js` and `scss` files should cause the page to refresh automatically.

