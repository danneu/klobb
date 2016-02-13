const gulp = require('gulp')
const del = require('del')
const ext = require('gulp-ext')
const babel = require('gulp-babel')
const cache = require('gulp-cached')
const help = require('gulp-task-listing')
const eslint = require('gulp-eslint')
const ava = require('gulp-ava')

gulp.task('help', help)

gulp.task('compile', [
  'compile-bin',
  'compile-test',
  'compile-src'
])

gulp.task('compile-bin', function () {
  return gulp.src('bin/*')
  .pipe(babel({
    presets: ['es2015']
  }))
  .pipe(ext.crop())
  .pipe(gulp.dest('build/bin'))
})

gulp.task('compile-test', function () {
  return gulp.src('test/*.js')
  .pipe(cache('test'))
  .pipe(babel({
    presets: ['es2015'],
    plugins: [
      'transform-runtime',
      'syntax-async-functions',
      'transform-async-to-generator',
      'transform-object-rest-spread'
    ]
  }))
  .pipe(gulp.dest('build/test'))
})

gulp.task('compile-src', function () {
  return gulp.src('src/**/*.js')
  .pipe(cache('src'))
  .pipe(babel({
    presets: ['es2015'],
    plugins: [
      'transform-runtime',
      'syntax-async-functions',
      'transform-async-to-generator',
      'transform-object-rest-spread'
    ]
  }))
  .pipe(gulp.dest('build/lib'))
})

gulp.task('test', ['compile'], function () {
  return gulp.src('build/test/*.js')
  .pipe(ava())
})

gulp.task('lint', function () {
  return gulp.src([
    'gulpfile.js',
    'test/*.js',
    'src/**/*.js',
    'bin/*'
  ])
  .pipe(eslint())
  .pipe(eslint.format())
  .pipe(eslint.failAfterError())
})

gulp.task('clean', function () {
  return del(['build'])
})

gulp.task('default', ['compile', 'test'])
