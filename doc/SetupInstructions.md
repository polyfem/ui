## Quick setup
This section is for setting up the workflow on your local machine
* Install nodejs
* Install an IDE, eg. VSCode, WebStorm
  * WebStorm preferred
* Clone the project from GitHub to local
* Open the terminal under the project root and execute: 
  ```npm install```.
  * This will install all the local dependencies including
  those used in the project and those for the workflow
* Run command: `npm install --global gulp-cli
  `.
* You are all set! Write code in the src folder. Typescript
linting should be in place. 

When you want to test the project, run command `gulp` in
root to compile. 
Navigate to dist folder to open compiled scripts and webpages.
  * Source mapping should in place, i.e. when you debug in the 
  browser console, it should display the source code instead of 
  the compiled code.
### IDE Shortcuts
  ...
## Maintenance setup
This section go through the setup process from scratch in 
detail.

First you'll need nodejs installed on your machine. Its package management
system npm will help speed up the development process greatly.
* ...

Once you have nodejs installed, execute `npm init` in root folder cli,
follow through the prompts to supply information about the project. Once
done, a package.json file will be created to track project dependencies etc.

Type script does not execute directly in browsers. It needs to be transpiled
into browser standards (es5) or nodejs standards (common js). You can run 
[tsc](https://www.typescriptlang.org/docs/handbook/compiler-options.html)
to generate es5 standard codes, but it often omits the transformation of certain 
`require('module')` statements into `import 'module'` statements
(https://code-trotter.com/web/understand-the-different-javascript-modules-formats/).

To fix this problem for projects with large dependencies, existing solutions include
[babel](https://babeljs.io/) that coerces both commonjs and es6 standards into
es5 standard codes or [browserify](https://browserify.org/) that supplies the internal
functionalities of `require` statements, etc. Both solutions will fully maintain the 
functionalities of one's code. Both solutions tend to walk the dependencies of one's codebase
and compile everything into a single js file, which is good for compatibility and efficiency.

This necessitates the pipeline:
* typescript -tsc-> javascript(commonjs & es) -browserify-> javascript (es5).

Running this pipeline manually each time is inconvenient, let alone the task of generating source maps
through each of these steps, packing assets, html, and css files. Thus, it becomes necessary to automate
this process. 

One can certainly write a `make` script for this task. But [gulp](https://gulpjs.com/) 
makes writing these compilation scripts much easier. It is essentially a "makefile" that runs in nodejs,
with a set of pipelining commands and libraries supplied. References for how gulp handles 
transpilation: https://gulpjs.com/docs/en/getting-started/working-with-files/, 
https://nodejs.org/api/stream.html. To work with gulp, install gulp-cli and modules by running:
```shell
npm install --global gulp-cli
npm install --save-dev gulp
```
Include a gulpfile.js in the root directory with content:
```js
var gulp = require("gulp");
var browserify = require("browserify");
var source = require("vinyl-source-stream");
var tsify = require("tsify");
var sourcemaps = require("gulp-sourcemaps");
var buffer = require("vinyl-buffer");

var paths = {
    pages: ["src/*.html"],
    stylesheets: ["src/css/**/*.*"],
    assets: ["assets/*.png"]
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
gulp.task(
    "default",
    gulp.series(gulp.parallel("copy-html", "copy-css", "copy-assets"), function () {
        return browserify({
            basedir: ".",
            debug: true,
            entries: ["src/js/main.ts"],
            cache: {},
            packageCache: {},
        })
            .plugin(tsify, {extensions:['js','ts']})
            .bundle()
            .pipe(source("index.js"))
            .pipe(buffer())
            .pipe(sourcemaps.init({ loadMaps: true }))
            .pipe(sourcemaps.write("./"))
            .pipe(gulp.dest("dist/js"));
    })
);
```
Inside this code, browserify is used with a [tsify](https://www.npmjs.com/package/tsify)
option. This option essentially specifies 
browserify to take typescript as its input and hence removes an intermediate step:
* typescript -browserify w/tsify->javascript(es5)

The code snippet makes use of some gulp specific dependencies. Install them by running:
```shell
npm install --save-dev browserify vinyl-source-stream tsify gulp-sourcemaps vinyl-buffer
```

To perform project compilation, execute `gulp` at root folder terminal.

All the installations performed above will be documented in package.json.
Future users can directly install all the dependencies by running 
`npm install` once.

Reference page for working with typescript & gulp:
https://www.typescriptlang.org/docs/handbook/gulp.html.