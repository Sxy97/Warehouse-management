function qiehuan(thi,obj1,obj2,obj3,obj4,obj5,obj6){
	$(thi).attr('class','active');
//  $(thi).siblings().removeClass()
	$(obj1).removeClass()
	$(obj2).removeClass()
	console.log($(obj1))	
	$(obj3).css('display','block')
	$(obj4).css('display','none')
	$(obj5).css('display','none')
	$(obj6).css('display','none')
}
function openShutManager(oSourceObj,oTargetObj,shutAble,oOpenTip,oShutTip){  
    var sourceObj = typeof oSourceObj == "string" ? document.getElementById(oSourceObj) : oSourceObj;  
    var targetObj = typeof oTargetObj == "string" ? document.getElementById(oTargetObj) : oTargetObj;  
    var openTip = oOpenTip || "";  
    var shutTip = oShutTip || "";  
    if(targetObj.style.display!="none"){  
       if(shutAble) return;  
       targetObj.style.display="none";  
       if(openTip  &&  shutTip){  
        sourceObj.innerHTML = shutTip;   
       }  
    } else {  
       targetObj.style.display="block";  
       if(openTip  &&  shutTip){  
        sourceObj.innerHTML = openTip;   
       }  
    }  
    }  
    