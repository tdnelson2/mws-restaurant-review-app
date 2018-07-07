const gulp         = require('gulp');
const autoprefixer = require('gulp-autoprefixer');
const browserSync  = require('browser-sync').create();
const sass         = require('gulp-sass');

// Static Server + watching scss/html files
gulp.task('serve', ['styles'], () => {

    browserSync.init({
        server: './',
        port: 8000
    });

    gulp.watch('sass/*.scss', ['styles']).on('change', browserSync.reload);
    gulp.watch('*.html').on('change', browserSync.reload);
    gulp.watch('js/*.js').on('change', browserSync.reload);
});

// Compile sass into CSS & auto-inject into browsers
gulp.task('styles', () => {
    return gulp.src('sass/*.scss')
        .pipe(sass().on('error', sass.logError))
        .pipe(gulp.dest('css'))
        .pipe(browserSync.stream());
});

gulp.task('default', ['serve']);