/*eslint-env node*/
const gulp         = require('gulp');
const autoprefixer = require('gulp-autoprefixer');
const browserSync  = require('browser-sync').create();
const sass         = require('gulp-sass');
const eslint       = require('gulp-eslint');
const jasmine      = require('gulp-jasmine-phantom');
const concat       = require('gulp-concat');
const uglify       = require('gulp-uglify-es').default;
const babel        = require('gulp-babel');
const sourcemaps   = require('gulp-sourcemaps');
const clean        = require('gulp-clean');
const runSequence  = require('run-sequence');
const imagemin     = require('gulp-imagemin');

const mainPage = [
  'js/custom-select.js',
  'js/dbhelper.js',
  'js/picture-el-builder.js',
  'js/main.js'];

const detailsPage = [
  'js/scroll-button.js',
  'js/dbhelper.js',
  'js/picture-el-builder.js',
  'js/restaurant_info.js'];

const serviceWorker = [
  'node_modules/idb/lib/idb.js',
  'js/myidb.js',
  './sw.js'
];

const favicons = [
  'favicons/android-chrome-192x192.png',
  'favicons/android-chrome-512x512.png',
  'favicons/apple-touch-icon.png',
  'favicons/browserconfig.xml',
  'favicons/favicon-16x16.png',
  'favicons/favicon-32x32.png',
  'favicons/favicon.ico',
  'favicons/mstile-70x70.png',
  'favicons/mstile-144x144.png',
  'favicons/mstile-150x150.png',
  'favicons/mstile-310x150.png',
  'favicons/mstile-310x310.png',
  'favicons/safari-pinned-tab.svg',
  'favicons/site.webmanifest'
];

// Static Server + watching scss/html files
gulp.task('serve', ['styles'], () => {

  browserSync.init({
    server: './dist',
    port: 8000
  });

  gulp.watch('sass/*.scss', ['styles']);
  gulp.watch('*.html', ['copy-html']);
  gulp.watch('js/*.js', ['scripts']);

  gulp.watch('js/*.js', ['lint']);

  gulp.watch('dist/css/*.css').on('change', browserSync.reload);
  gulp.watch('dist/*.html').on('change', browserSync.reload);
  gulp.watch('dist/js/*.js').on('change', browserSync.reload);
});

// Compile sass into CSS & auto-inject into browsers
gulp.task('styles', () => {
  return gulp.src('sass/*.scss')
    .pipe(sourcemaps.init())
    .pipe(sass({outputStyle: 'compressed'}).on('error', sass.logError))
    .pipe(autoprefixer({
      browsers: ['last 5 versions']
    }))
    .pipe(sourcemaps.write())
    .pipe(gulp.dest('dist/css'))
    .pipe(browserSync.stream());
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

const scripts = (paths, outputName, outputDir) => {
  return gulp.src(paths)
    .pipe(sourcemaps.init())
    .pipe(concat(outputName))
    .pipe(sourcemaps.write())
    .pipe(gulp.dest(outputDir));
};

gulp.task('scripts', () => {
  scripts(mainPage, 'main-all.js', 'dist/js');
  scripts(detailsPage, 'restaurant-all.js', 'dist/js');
  scripts(serviceWorker, 'sw.js', 'dist');
  return gulp.src('js/sw-reg.js').pipe(gulp.dest('dist/js'));
});

const scriptsDist = (paths, outputName, outputDir) => {
  return gulp.src(paths)
    .pipe(sourcemaps.init())
    .pipe(babel({
      presets: ['env']
    }))
    .pipe(concat(outputName))
    .pipe(uglify())
    .pipe(sourcemaps.write())
    .pipe(gulp.dest(outputDir));
};

gulp.task('scripts-dist', () => {
  scriptsDist(mainPage, 'main-all.js', 'dist/js');
  scriptsDist(detailsPage, 'restaurant-all.js', 'dist/js');
  scriptsDist(['js/sw-reg.js'], 'sw-reg.js', 'dist/js');
  return gulp.src(serviceWorker)
    .pipe(sourcemaps.init())
    .pipe(concat('sw.js'))
    .pipe(uglify())
    .pipe(sourcemaps.write())
    .pipe(gulp.dest('dist'));
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
  runSequence('lint', 'clean', 'copy-images', ['copy-html', 'scripts-dist', 'styles', 'copy-favicons']);
});