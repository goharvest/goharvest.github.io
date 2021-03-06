var gulp = require('gulp');
var pkg = require('./package.json');

// include plug-ins
var jshint = require('gulp-jshint');
//var jscs = require('gulp-jscs');
var concat = require('gulp-concat');
//var stripDebug = require('gulp-strip-debug');
var uglify = require('gulp-uglifyes');
var sass = require('gulp-sass');
var sourcemaps = require('gulp-sourcemaps');
var autoprefixer = require('autoprefixer');
var postcss = require('gulp-postcss');
var header = require('gulp-header');

// options
var sassOptions = {
  errLogToConsole: true,
  outputStyle: 'compressed' //expanded, nested, compact, compressed
};
var autoprefixerOptions = {
  browsers: ['last 2 versions', '> 5%', 'Firefox ESR']
};


// JS concat, strip debugging and minify
gulp.task('scripts', scripts);

function scripts(done) {
       
  var banner = ['/**',
                  ' * <%= pkg.name %>',
                  ' * (c) 2018 Brandon J. C. Fuller, All Rights Reserved ',
                  ' * ',
                  ' * @version v<%= pkg.version %>',
                  ' * @author <%= pkg.author %>',
                  ' */',
                  '',
                  ''].join('\n');
      
  gulp.src('./src/js/*.js')
    .pipe(jshint(done))
    .pipe(jshint.reporter('default'));
	gulp.src('./src/js/*.js')
    .pipe(concat('harvest.built.js'))
    //.pipe(uglify({ ecma: 6 }))
    .pipe(header(banner, { pkg : pkg } ))
    .pipe(gulp.dest('./js/'));
    
	done();
 // console.log('scripts ran');
}

// CSS concat, auto-prefix and minify
gulp.task('styles', styles);

function styles(done) {
    
	gulp.src('./src/sass/**/*.scss')
		.pipe(sourcemaps.init())
		.pipe(sass(sassOptions).on('error', sass.logError))
		.pipe(concat('styles.built.css'))
	    .pipe(postcss([ autoprefixer() ]))
	    //.pipe(header(banner, { pkg : pkg } ))
		.pipe(sourcemaps.write('./map'))
		.pipe(gulp.dest('./css/'));

  done();
  //console.log('styles ran');
}

// watch
gulp.task('watcher', watcher);

function watcher(done) {
	// watch for JS changes
	gulp.watch('./src/js/*.js', scripts);

	// watch for CSS changes
	gulp.watch('./src/sass/**/*.scss', styles);

	done();
}

gulp.task( 'default',
	gulp.parallel('scripts', 'styles', 'watcher', function(done){
		done();
	})
);


function done() {
	console.log('done');
}