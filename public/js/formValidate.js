$(document).ready(function(){
  $('#register-form').on('submit', function(){
    return true;
    var shouldSubmit = false;
    if(new RegExp('[1]{1}[3-6]{1}[a-zA-Z]{3}\d{4}').test($('input[name="regNo"]').val())){
      if(new RegExp('[789]\d{9}').test($('input[name="contact"]').val())){
        return true;
      } else{
        $('input[name="contact"]').parents($('.custom-input')).append('<span class="red-text">Invalid Phone Number</span>')
      }
    } else{
      $('input[name="regNo"]').parents($('.custom-input')).append('<span class="red-text">Invalid Registration Number</span>')
    }
    return false;
  })
})
