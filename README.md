pms
===

移动端iframe通信库

 frame窗口通信指导
 PMS 用于frame窗口之间通信
 PMS对象暴露三个接口
 bind : 用于注册事件，当有窗口发送消息过来并且类匹配时，则会触发注册时相应的回调函数
 send : 用于向指定的目标窗口发送信息
 unbind : 取消之肖注册的事件

 使用demo
 现在假设我们有两个frame窗口,一个是主窗口mainFrame ,一个是子窗口childFrame
 现在我们得在两个frame窗口中进行消息传递,则我们可以像下面这样操作

 1 、 mainFrame传递消息到childFrame
    1.1 childFrame注册事件，在childFrame的js代码中
    PMS.bind('onload' , function(e){} , '*')
    此时childFrame已经注册了消息处理，当有窗口往childFrame消息事，此处注册的回调就会被执行
    参数{onload : 消息类型 , function : 回调函数 , '*' : 消息通信的域}

    1.2 此时子窗口已准备，等待其它窗口发送消息的到来
    此时mainFrame给childFrame发送一个消息
    此处写在mainFrame的代码中
    PMS.send({
        target : frames[0],       //发送到目标窗口
        url :                     //URL
        type : 'onload' ,         //消息类型
        data : {                  //附带数据
            name : 'alice' ,
            age : 27
        },
        success : function(){     //成功回调
        },
        error : function(e){      //失败回调
        }
    });


   其它frame通信跟上面差不多,
   多个frame之间也能相互通信，只要通信目标正确即可

   如果是子窗口发信息给父窗口，则像下面之样即可
   PMS.send({
       target : window.parent
       其它参数与上面相同
   });

    target : 必填
    type : 必填
    其它参数可选

    参考
    https://developer.mozilla.org/en-US/docs/DOM/window.postMessage

  了解更多可分析下面源码
 
