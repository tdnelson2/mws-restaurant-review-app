
# Restaurant Reviews

## Overview

I completed this for the [Udacity Mobile Web Specialist Certification Course](https://www.udacity.com/course/mobile-web-specialist-nanodegree--nd024). This commit represents stage 3, the final stage in the course. The objective is to convert [this static webpage](https://github.com/udacity/mws-restaurant-stage-1) to a responsive, mobile-ready web application which is in compliance with accepted accessibility standards and functional during limited or no internet connectivity.

### Requirements

* [ImageMagick](https://www.imagemagick.org/script/download.php#macosx) is required to use the Grunt script to build the responsive images. The installation process is quite lengthy so if you don't want to build the responsive images, you can download them [here](https://drive.google.com/file/d/1IdAnvCcv86bk26hY2B9RzKWSag7WJscy/view?usp=sharing). Just unzip in the project directory before running gulp. Otherwise here are the installation instructions for macOS (I've only attempted installation on macOS):
  * Make sure [Xcode and the Xcode Command Line Tools](https://guide.macports.org/#installing.xcode) are installed.
  * Downlaod and install [MacPorts](https://www.macports.org/install.php).
  * In a terminal run `sudo port install ImageMagick` to install ImageMagick. Be patient. Installation can take several minutes.

* Development also requires [Grunt](https://gruntjs.com/), [Gulp](https://gulpjs.com/), [Browserify](http://browserify.org/#install), [ESLint](https://eslint.org/docs/user-guide/getting-started) and [sailsjs](https://sailsjs.com/get-started). In a terminal, run these to install as needed:
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
* With the API running, run `gulp` in the project directory. The page should automatically launch in your default browser. Modifying the `html`, `js` and `scss` files should cause the page to refresh automatically. Auditing in development mode will produce lower scores. See below for how to setup the project for auditing.

### Auditing
* With the API running, run `gulp build-prod`.
* `cd` into the `dist` directory.
* Run `python3 -m http.server 8000`. (or `python -m SimpleHTTPServer 8000` for Python 2.x).
* In Chrome dev tools, under the 'Audits' tab click 'Run audits'. With the exception of 'SEO' and 'Best practices', scores should be > 90.