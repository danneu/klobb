const gulp = require('gulp');
const del = require('del');
const ext = require('gulp-ext');
const babel = require('gulp-babel');
const cache = require('gulp-cached');
const help = require('gulp-task-listing');

gulp.task('help', help);

gulp.task('compile', [
  'compile-bin',
  'compile-src'
]);

gulp.task('compile-bin', function () {
  return gulp.src('bin/*')
  .pipe(babel({
    presets: ['es2015']
  }))
  .pipe(ext.crop())
  .pipe(gulp.dest('build/bin'));
});

gulp.task('compile-src', function () {
  return gulp.src('src/**/*.js')
  .pipe(cache('src'))
  .pipe(babel({
    presets: ['es2015'],
    plugins: [
      'transform-runtime',
      'syntax-async-functions',
      'transform-async-to-generator'
    ]
  }))
  .pipe(gulp.dest('build/lib'));
});

gulp.task('clean', function () {
  return del(['build']);
});

gulp.task('default', ['compile']);
