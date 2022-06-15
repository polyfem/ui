var gulp = require("gulp");
var browserify = require("browserify");
var source = require("vinyl-source-stream");
var tsify = require("tsify");
var sourcemaps = require("gulp-sourcemaps");
var buffer = require("vinyl-buffer");

var paths = {
    pages: ["src/*.html"],
    stylesheets: ["src/css/**/*.*"],
    assets: ["assets/*.png"],
    prism: ["src/prism/*.*"]
};
gulp.task("copy-html", function () {
    return gulp.src(paths.pages).pipe(gulp.dest("dist"));
});
gulp.task("copy-css", function () {
    return gulp.src(paths.stylesheets).pipe(gulp.dest("dist/css"));
});
gulp.task("copy-assets", function () {
    return gulp.src(paths.assets).pipe(gulp.dest("dist/assets"));
});
gulp.task("copy-prism", function(){
    return gulp.src(paths.prism).pipe(gulp.dest("dist/prism"));
})
gulp.task(
    "default",
    gulp.series(gulp.parallel("copy-html", "copy-css", "copy-assets", "copy-prism"), function () {
        return browserify({
            basedir: ".",
            debug: true,
            entries: ["src/js/main.ts"],
            cache: {},
            packageCache: {},
        })
            .plugin(tsify, {extensions:['js','ts']})
            .bundle()
            .pipe(source("main.js"))
            .pipe(buffer())
            .pipe(sourcemaps.init({ loadMaps: true }))
            .pipe(sourcemaps.write("./"))
            .pipe(gulp.dest("dist/js"));
    })
);