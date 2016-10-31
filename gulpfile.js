/*
	Browserify + Reactify + Babelify
*/
var source = require('vinyl-source-stream'),
	gulp =  require('gulp'),
	gutil = require('gulp-util'),
	browserify = require('browserify'),
	babelify = require('babelify'),
	watchify = require('watchify'),
	notify = require('gulp-notify'),
	stylus = require('gulp-stylus'),
	autoprefixer = require('gulp-autoprefixer'),
	uglify = require('gulp-uglify'),
	rename = require('gulp-rename'),
	buffer = require('vinyl-buffer'),
	browserSync = require('browser-sync'),
	reactify = require('reactify'),
	reload = browserSync.reload,
	srcDir = './src/',
	publicDir = './public/',
	assetDir = publicDir+'assets/';

/*
	Styles Task
*/ 

gulp.task('styles',function(){
	// move over fonts
	gulp.src(srcDir+'css/fonts/**.*')
		.pipe(gulp.dest(assetDir+'fonts'));

	// Compiles CSS
	gulp.src(srcDir+'css/style.styl')
		.pipe(stylus())
		.pipe(autoprefixer())
		.pipe(gulp.dest(assetDir+'css'))
		.pipe(reload({stream:true}))	
});

/*
	Browser Sync
*/
gulp.task('browser-sync',function(){
	browserSync({
		// We need disable clisks and forms for when we test multiple rooms
		server:{ baseDir: publicDir},
		ghostMode:false
	});

})

function handleErrors() {
	var args = Array.prototype.slice.call(arguments);
	notify.onError({
		title: 'Compile Error',
		message: '<%= error.message %>'
	}).apply(this,args);
	this.emit('end'); // Keep gulp from hanging on this task

}

function buildScript(file, watch) {
	var props = {
		entries: [srcDir+'scripts/' + file],
		debug: true,
		transform: [babelify,reactify]
	};
	// watchify() if watch requested, otherwise run browserify() once
	var bundler = watch ? watchify(browserify(props)) : browserify(props);
	function rebunlde() {
		var stream = bundler.bundle();
		return stream
			.on('error', handleErrors)
      		.pipe(source(file))
	      	.pipe(gulp.dest(assetDir+'scripts'))
			//if you also want to uglify it
			// .pipe(buffer())
			// .pipe(uglify())
			// .pipe(rename('app.min.js'))
			// .pipe(gulp.dest('./build'))
			.pipe(reload({stream:true}));
	}

	//listen for an update and run rebundle
	bundler.on('update',function(){
		rebunlde();
		gutil.log('Rebundle....');
	})

	// run it once the first time  buildScript is called
	return rebunlde();
}

gulp.task('scripts',function(){
	return buildScript('main.js',false);//this will once run once because we set watch  to false
});

//run 'scripts' task first, then watch for future changes
gulp.task('default',['styles','scripts','browser-sync'],function(){
	gulp.watch(srcDir+'css/**/*',['styles']); // gulp watch for styles changes
	gulp.watch(publicDir+"**/*.html").on('change', browserSync.reload); // gulp watch for html changes
	return buildScript('main.js',true); //browserify watch for js changes

});