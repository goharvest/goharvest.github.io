var gulp = require('gulp');

// include plug-ins
var jshint = require('gulp-jshint');
var imagemin = require('gulp-imagemin');
var concat = require('gulp-concat');
var stripDebug = require('gulp-strip-debug');
var autoprefix = require('gulp-autoprefixer');
var minifyCSS = require('gulp-minify-css');
var sass = require('gulp-sass');
var sourcemaps = require('gulp-sourcemaps');
var autoprefixer = require('gulp-autoprefixer');
var header = require('gulp-header');
var uglify = require('gulp-uglify');

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
        
  var banner = ['/* Harvest v2.3 | (c) 2017 Brandon J. C. Fuller, All Rights Reserved | Requires jQuery 3.1.1 (jquery.org), jQuery UI 1.12.1 (jqueryui.com), and Velocity.js 1.3.1 (velocityjs.org) */'].join('\n')
  
  gulp.src('./src/js/*.js')
    .pipe(jshint(done))
    .pipe(jshint.reporter('default'));
	gulp.src('./src/js/*.js')
    .pipe(concat('harvest.built.js'))
    //.pipe(uglify())
    .pipe(header(banner))
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
		.pipe(autoprefixer(autoprefixerOptions))
		.pipe(concat('styles.built.css'))
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