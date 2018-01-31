  var textWidth = function(text){ 
        var sensor = $('<pre>'+ text +'</pre>').css({display: 'none'}); 
        $('body').append(sensor); 
        var width = sensor.width();
        sensor.remove(); 
        return width;
    };
     $("input").unbind('keydown').bind('keydown', function(){
        $(this).width(textWidth($(this).val()));
    });