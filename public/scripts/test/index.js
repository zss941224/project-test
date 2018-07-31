//index JS

$(function(){
  // 切换到注册页面
  $('.change-register-page').click(function(){
    $('.homepage-login-w').addClass('hide');
    $('.homepage-register-w').removeClass('hide');
  })
  // 切换到登录页面
  $('.change-login-page').click(function(){
    $('.homepage-register-w').addClass('hide');
    $('.homepage-login-w').removeClass('hide');
  })
})
