'use strict';

var gulp = require('gulp');
var plugins = require('gulp-load-plugins')();

var scripts = {
  name: 'Ruby.js',
  all: [
    'gulpfile.js',
    'dist/Ruby.js'
  ],
  list: [
    'src/intro.js',
    'src/variables.js',
    'src/utilities.js',
    'src/Ruby.js',
    'src/reaction.js',
    'src/outro.js'
  ],
  main: 'dist/Ruby.js',
  src: 'src/*.js',
  dest: 'dist'
};

gulp.task('concat', function () {
  return gulp.src(scripts.list)
    .pipe(plugins.concat(scripts.name))
    .pipe(gulp.dest(scripts.dest));
});

gulp.task('run', function () {
  return plugins.run('node dist/Ruby.js').exec()
  .pipe(gulp.dest('output'));
});

gulp.task('js+', function () {
  return gulp.src(scripts.list)
    .pipe(plugins.concat(scripts.name))
    .pipe(gulp.dest(scripts.dest));
});

gulp.task('jshint', ['js+'], function () {
  return gulp.src(scripts.all)
    .pipe(plugins.jshint())
    .pipe(plugins.jshint.reporter('default'));
});

gulp.task('jscs', ['js+'], function () {
  return gulp.src(scripts.all)
    .pipe(plugins.jscs())
    .pipe(plugins.jscs.reporter());
});

gulp.task('js', ['jshint', 'jscs'], function () {
  return gulp.src(scripts.main)
    .pipe(plugins.rename({
      suffix: '.min'
    }))
    .pipe(plugins.uglify({
      ignoreFiles: ['*.map', '-min.js']
    }))
    .pipe(gulp.dest(scripts.dest));
});



gulp.task('watch', function () {
  gulp.watch(scripts.list, ['concat', 'run']);
});

gulp.task('default', ['watch']);
