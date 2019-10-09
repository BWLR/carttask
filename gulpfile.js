var gulp        = require("gulp"),
    argv        = require('yargs').argv,
    $           = require('gulp-load-plugins')(),
    del         = require('del'),
    ifElse      = require('gulp-if-else'),
    browserSync = require("browser-sync").create();

var conf = {
    src: {
        styles:       [
            './scss/style.scss'
        ],
        scripts: [
            './node_modules/jquery/dist/jquery.slim.min.js',
            './js/components/cart.js',
            './js/main.js',
        ]
    },
    dest: {
        template: './docs',
        styles:   './docs/style',
        scripts:  './docs/js',
    },
    watch: {
        templates: ['./index.html', './templates/**/*.html'],
        styles:    ['./scss/style.scss', './scss/**/*.scss'],
        scripts:   ['./js/main.js', './js/**/*.js'],
    },
    production: argv.production
};

/**
 * Clear out /library directory
 */
function clean() {
    return del([
        conf.dest.styles + '/**/*',
        conf.dest.scripts + '/**/*',
    ]);
}

// Documentation https://stylelint.io/user-guide/configuration/
// https://stylelint.io/user-guide/example-config/
// settings file .stylelintrc
function lint() {
    return gulp.src(['./scss/_base/*.scss', './scss/_components/*.scss', './scss/_pages/*.scss'])
        .pipe(ifElse(!conf.production,
            function () {
                return $.stylelint({
                    // debug: true,
                    failAfterError: true,
                    reporters: [
                        // {formatter: 'string', console: true},
                        {formatter: 'verbose', console: true},
                    ]
                })
            }
        ));
};

/**
 * Template
 */
function templates() {
    return gulp.src(['index.html'])
        .pipe($.fileInclude({
            prefix: '@@',
            basepath: '@file'
        }))
        .pipe(gulp.dest(conf.dest.template));
}

/**
 * Styles
 */
function styles() {
    return $.rubySass(conf.src.styles, {
            style: ifElse(conf.production, function () { return 'compressed'; }, function () { return 'expanded'; } ),
            sourcemap: ifElse(conf.production, function () { return false; }, function () { return true; } )
        })
        .pipe($.autoprefixer({
            browsers: ['ie > 10', '> 0.5%'],
            grid: 'autoplace',
            cascade: false
        }))
        .on('error', $.rubySass.logError)
        .pipe(ifElse(!conf.production,
            function () {
                // return $.sourcemaps.write('maps'); // For file sourcemaps
                return $.sourcemaps.write(); // For inline sourcemaps
            }
        ))
        .pipe(gulp.dest(conf.dest.styles))
        .pipe($.notify('✅ Styles built'))
        .pipe(browserSync.stream());
};

/**
 * JavaScript
 */
function scripts() {
    return gulp.src(conf.src.scripts)
        .pipe($.concat('main.js'))
        .pipe($.babel({
            presets: [
                ['@babel/env', {
                    modules: false
                }]
            ]
        }))
        .pipe(ifElse(conf.production,
            function () { return $.stripDebug(); }
        ))
        .pipe(ifElse(conf.production,
            function () { return $.uglify(); }
        ))
        .on('error', $.util.log)
        .pipe(gulp.dest(conf.dest.scripts))
        .pipe($.notify('✅ Scripts built'))
        .pipe(browserSync.stream());
};

/**
 * Static Server + watching scss/html files
 */
var build = gulp.series(clean, lint, templates, gulp.parallel(styles, scripts));
function watch() {
    browserSync.init({
        server: {
            baseDir: conf.dest.template,
            index: 'index.html'
        }
    });

    gulp.watch(conf.watch.templates, templates);
    gulp.watch(conf.watch.scripts, scripts);
    gulp.watch(conf.watch.styles, styles);
}

/*
 * Declare available tasks
 */
exports.clean = clean;
exports.styles = styles;
exports.scripts = scripts;
exports.watch = gulp.series(build, watch);
exports.build = build;

/*
 * Default task that can be called by just running `gulp` from cli
 */
exports.default = build;