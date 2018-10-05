/*eslint-env node*/
const gulp         = require('gulp');
const autoprefixer = require('gulp-autoprefixer');
const browserSync  = require('browser-sync').create();
const scss         = require('gulp-sass');
const eslint       = require('gulp-eslint');
const jasmine      = require('gulp-jasmine-phantom');
const concat       = require('gulp-concat');
const uglify       = require('gulp-uglify-es').default;
const babel        = require('gulp-babel');
const sourcemaps   = require('gulp-sourcemaps');
const clean        = require('gulp-clean');
const runSequence  = require('run-sequence');
const imagemin     = require('gulp-imagemin');
const inject       = require('gulp-inject-string');
var header         = require('gulp-header');
const fs           = require('fs');
const util         = require('util');
const readFile     = util.promisify(fs.readFile);

const idbPromise = readFile('./node_modules/idb/lib/idb.js', 'utf8');
const polyfillPromise = readFile('./js-header/header.js', 'utf8');

const scriptBundle = [
  'js/app-name.js',
  'js/myidb.js',
  'js/toggle-button.js',
  'js/dbhelper.js',
  'js/custom-select.js',
  'js/picture-el-builder.js',
  'js/scroll-button.js',
  'js/restaurant.js',
  'js/review.js',
  'js/restaurant_info.js',
  'js/main.js'];

const serviceWorker = [
  'js/app-name.js',
  './sw.js'
];

const favicons = './favicons/*';

// Static Server + watching scss/html files
gulp.task('serve', ['styles'], () => {

  browserSync.init({
    server: './dist',
    port: 8000
  });

  gulp.watch('scss/*.scss', ['styles']);
  gulp.watch('*.html', ['copy-html']);
  gulp.watch('js/*.js', ['scripts']);

  gulp.watch('js/*.js', ['lint']);

  gulp.watch('dist/css/*.css').on('change', browserSync.reload);
  gulp.watch('dist/*.html').on('change', browserSync.reload);
  gulp.watch('dist/js/*.js').on('change', browserSync.reload);
});

// Compile scss into CSS & auto-inject into browsers
gulp.task('styles', () => {
  return gulp.src('scss/*.scss')
    .pipe(sourcemaps.init())
    .pipe(scss({outputStyle: 'compressed'}).on('error', scss.logError))
    .pipe(autoprefixer({
      browsers: ['last 5 versions']
    }))
    .pipe(sourcemaps.write())
    .pipe(gulp.dest('dist/css'))
    .pipe(browserSync.stream());
});

gulp.task('styles-dist', () => {
  return gulp.src('scss/*.scss')
    // .pipe(sourcemaps.init())
    .pipe(scss({outputStyle: 'compressed'}).on('error', scss.logError))
    .pipe(autoprefixer({
      browsers: ['last 5 versions']
    }))
    // .pipe(sourcemaps.write())
    .pipe(gulp.dest('dist/css'));
});

gulp.task('lint', () => {
  return gulp.src(['js/*.js'])
    // eslint() attaches the lint output to the "eslint" property
    // of the file object so it can be used by other modules.
    .pipe(eslint())
    // eslint.format() outputs the lint results to the console.
    // Alternatively use eslint.formatEach() (see Docs).
    .pipe(eslint.format())
    // To have the process exit with an error code (1) on
    // lint error, return the stream and pipe to failAfterError last.
    .pipe(eslint.failAfterError());
});

gulp.task('copy-html', () => {
  return gulp.src('./*.html')
    .pipe(gulp.dest('./dist'));
});

gulp.task('copy-images', () => {
  return gulp.src('img/*')
    .pipe(imagemin([
      imagemin.gifsicle({interlaced: true}),
      imagemin.jpegtran({
        progressive: true
      }),
      imagemin.optipng({optimizationLevel: 5}),
      imagemin.svgo({
        plugins: [
          {removeViewBox: true},
          {cleanupIDs: false}
        ]
      })
    ]))
    .pipe(gulp.dest('dist/img'));
});

gulp.task('copy-favicons', () => {
  return gulp.src(favicons)
    .pipe(gulp.dest('dist/'));
});

gulp.task('copy-data', () => {
  return gulp.src('data/restaurants.json')
    .pipe(gulp.dest('dist/data'));
});

gulp.task('scripts', () => {
  Promise.all([polyfillPromise, idbPromise])
    .then(values => {
      gulp.src(scriptBundle)
        .pipe(sourcemaps.init())
        .pipe(concat('script-bundle.js'))
        // Wrap the script bundle in the polyfill check.
        .pipe(header(`${values[0]}\n${values[1]}\n}\n`))
        // Add the trailing curly brace.
        .pipe(inject.append('\n};'))
        .pipe(sourcemaps.write('../maps'))
        .pipe(gulp.dest('dist/js'));

      return gulp.src(serviceWorker)
        .pipe(sourcemaps.init())
        .pipe(concat('sw.js'))
        .pipe(sourcemaps.write('maps'))
        .pipe(sourcemaps.write())
        .pipe(gulp.dest('dist'));
    });
});

gulp.task('scripts-dist', () => {
  Promise.all([polyfillPromise, idbPromise])
    .then(values => {
      gulp.src(scriptBundle)
        .pipe(sourcemaps.init())
        .pipe(babel({
          presets: ['env']
        }))
        .pipe(concat('script-bundle.js'))
        // Wrap the script bundle in the polyfill check.
        .pipe(header(`${values[0]}\n${values[1]}\n}\n`))
        // Add the trailing curly brace.
        .pipe(inject.append('\n};'))
        .pipe(uglify())
        .pipe(sourcemaps.write('../maps'))
        .pipe(gulp.dest('dist/js'));

      return gulp.src(serviceWorker)
        .pipe(sourcemaps.init())
        .pipe(concat('sw.js'))
        .pipe(uglify())
        .pipe(sourcemaps.write('maps'))
        .pipe(gulp.dest('dist'));
    });
});

gulp.task('clean', () => {
  return gulp.src('dist/', {read: false})
    .pipe(clean());
});

gulp.task('tests', () => {
  return gulp.src('tests/spec/extraSpec.js')
    .pipe(jasmine({
      integration: true,
      vendor: 'js/*.js'
    }));
});

gulp.task('default', () => {
  runSequence('lint', 'clean', 'copy-images', ['copy-html', 'scripts', 'copy-favicons'], 'serve');
});

gulp.task('build-prod', () => {
  runSequence('lint', 'clean', 'copy-images', ['copy-html', 'scripts-dist', 'styles-dist', 'copy-favicons']);
});