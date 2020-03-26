const gulp = require('gulp');
const sass = require('gulp-sass');
const concat = require('gulp-concat');
const pug = require('gulp-pug');

// Sass configuration
gulp.task('sass', function () {
    return gulp.src('./public/sass/*.sass')
        .pipe(sass(
            { outputStyle: 'expanded' }
        ).on('error', sass.logError))
        .pipe(gulp.dest('./build/css'));
});

//pug configuration
gulp.task('pug', function () {
    return gulp.src('./public/pug/*.pug')
        .pipe(pug(
            { pretty: true }
        ).on('error', sass.logError))
        .pipe(gulp.dest('./build/'));
});

//js configuration
gulp.task('concatJS', function () {
    return gulp.src('./public/javascripts/*.js')
        .pipe(concat('all.js'))
        .pipe(gulp.dest('./build/js'));
});

gulp.task('default', function () {
    gulp.watch('./public/sass/*.sass', gulp.series('sass'));
    gulp.watch('public/pug/*.pug', gulp.series('pug'));
    gulp.watch('public/javascripts/*.js', gulp.series('concatJS'));
});

gulp.task('all', gulp.series('sass', 'pug', 'concatJS'));