var gulp = require('gulp'),
		minifycss = require('gulp-minify-css'),
		uglify  = require('gulp-uglify'),
		rename = require('gulp-rename'),
		concat  = require('gulp-concat'),
		imagemin = require('gulp-imagemin'),
		pngquant = require('imagemin-pngquant');
var gulpUtil = require('gulp-util');
var autoprefixer = require('gulp-autoprefixer'); // 引入css样式自动加浏览器前缀功能
var connect = require('gulp-connect');
var proxy = require('http-proxy-middleware');
var path = require('path');
var projectdir = path.resolve(__dirname, '../project-test/');
var through = require('through2');
var fz = 41.4;


gulp.task('server', function() {
    connect.server({
        livereload: true,  //实时刷新
        port: 8989,
				host:'0.0.0.0',
        // middleware: function (connect, opt) {
        //   return [
        //       proxy(['/api'], {
        //           target: 'http://192.168.1.13', //这里实际的测试地址
        //           changeOrigin: true
        //       })
        //   ]
        // }
    });
});


gulp.task('scssTotmpcss', ()=>{
  // 编译css
  var sass = require('gulp-ruby-sass');
  var concat = require('gulp-concat');
  return sass(['public/scss/*.scss'],{
      style: 'expanded',
      precision: 10
      })
  .on('error', console.error.bind(console))
  .pipe(gulp.dest('public/tmpstyles'));
});

gulp.task('tmpcssTocss', ()=>{
  // 自动前缀
  return gulp.src('public/tmpstyles/*.css')
    .pipe(autoprefixer({
      browsers: ['last 2 versions','Android >= 4.0'],
      cascade: true,
      remove: true
    }))
    .pipe(gulp.dest('public/styles'))
});

gulp.task('css', ['scssTotmpcss', 'tmpcssTocss']);

// 压缩css
gulp.task('minifycss',function(){
	return gulp.src(['public/styles/**/*.css'])
	.pipe(minifycss())
	.pipe(gulp.dest('dist/styles'))
})

// 压缩js
gulp.task('js',function(){
	return gulp.src(['public/scripts/test/**/*.js'])
		.pipe(uglify().on('error', gulpUtil.log))
		.pipe(gulp.dest('dist/scripts/test'));
})

// gulp.task('jub',function() {
//   return gulp.src(['public/scripts/jquery.js','public/scripts/underscore.js','public/scripts/backbone.js'])
//     .pipe(uglify())
//     .pipe(concat('jub.js'))
//     .pipe(gulp.dest('public/scripts'))
//     .pipe(gulp.dest('dist/scripts'));
// });


// 生成雪碧图
gulp.task('spriter',()=>{
  const js_to_css =  function(obj) {
    let _decode = [];
    let _css = "";
    for (n in obj){
      _decode.push({selector: n, styles: obj[n], number_of_objs: 0})
    }
    while (_decode.length > 0) {
      var selector = _decode[0].selector;
      var styles = _decode[0].styles;
      _css += "\n\r"+ selector+" {";
      for (var n in styles) {
          if (styles.hasOwnProperty(n)) {
              if (typeof styles[n] === "string") {
                  _css += n + ": " + styles[n]+"; ";
              } else {
                  const _index = _decode[0].number_of_objs + 1;
                  _decode.splice(_index, 0, {selector: selector + " " + n, styles: styles[n], number_of_objs: 0})
                  _decode[0].number_of_objs++;
              }
          }
      }
      _css += "}  ";
      _decode.splice(0, 1);
    }
    return _css;
  }
  const spritesmith = require('gulp.spritesmith');

  // 分文件夹合并雪碧图
  return gulp.src('public/images/icons/**')
        .pipe(through.obj(function(file,enc,cb){
              if(file.relative && file.relative.indexOf('.')=='-1'){
                gulp.src('public/images/icons/'+file.relative+'/*.png')
                  .pipe(spritesmith({
                      imgName:'public/images/'+file.relative+'_sprite.png',  //保存合并后图片的地址
                      cssName:'public/scss/'+file.relative+'_sprite.scss',   //保存合并后对于css样式的地址
                      padding:30,
                      algorithm:'top-down',
                      cssTemplate:function(data){
                        var mobileSpriteObj = {};
                        var webSpriteObj = {};
                        data.sprites.forEach(function (sprite) {
                          // console.log('sprite.px:',sprite.px)
                          var name = '.icon-'+sprite.name;
                          var mobileSizeScale = 0.8;

                          let newMobileData;

                          // // 移动端rem布局的
                          // newMobileData = {
                          //   "display":"inline-block",
                          //   "background-image": 'url('+sprite["escaped_image"]+')',
                          //   "background-position":((sprite.px.offset_x.replace("px",''))/2/fz*mobileSizeScale+'rem')+' '+((parseFloat(sprite.px.offset_y.replace("px",'')))/2/fz*mobileSizeScale+'rem'),
                          //   "background-size":((sprite.total_width) / 2 /fz*mobileSizeScale+"rem")+' '+((sprite.total_height) / 2 /fz*mobileSizeScale+"rem"),
                          //   "width":width,
                          //   "height":height
                          // }
                          // mobileSpriteObj[name] = newMobileData;
                          // web端px布局的
                          let newWebData = {
                            "display":"inline-block",
                            "background-image": 'url('+sprite["escaped_image"]+')',
                            "background-position":((sprite.px.offset_x.replace("px",''))/2+'px')+' '+((parseFloat(sprite.px.offset_y.replace("px",'')))/2+'px'),
                            "background-size":((sprite.total_width)/ 2 +"px")+' '+((sprite.total_height)/ 2 +"px"),
                            "width":((parseFloat(sprite.px.width.replace("px",'')))/2+'px'),
                            "height":((parseFloat(sprite.px.height.replace("px",'')))/2+'px')
                          }
                          webSpriteObj[name] = newWebData;

                          delete sprite.name;
                        });
                        return js_to_css(webSpriteObj)
                              +'\n\r\n\r'+'@media screen and (max-width: 449px){'
                              +js_to_css(mobileSpriteObj)
                              +'\n\r}';
                      }
                  }))
                  .pipe(gulp.dest('.'));
              }
              this.push(file);
              cb();
          }));


})


// 压缩图片
gulp.task('mini',function(){
	return gulp.src('public/images/**/')
		.pipe(imagemin({
			progressive: true,
			svgoPlugins: [{removeViewBox: false}],
			use: [pngquant()]
		}))
		.pipe(gulp.dest('dist/images'));
})

gulp.task('publish',['css','minifycss','js','mini'],function(){
})

// html
gulp.task('html', function() {
    gulp.src('./*.html')
        .pipe(connect.reload());
});

gulp.task('default',['server','spriter','css'],function(){
  gulp.watch(['public/images/icons/**'],['spriter']);
  gulp.watch(['public/scss/*.scss'],['css']);
  gulp.watch([
    'public/images/**',
    'public/scss/*.scss',
    'public/scripts/**/*.js',
    '*.html'
    ],['html']);

})
