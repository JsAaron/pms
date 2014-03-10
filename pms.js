/*  
     **  frame窗口通信指导
     **  PMS 用于frame窗口之间通信
     **  PMS对象暴露三个接口
     * bind : 用于注册事件，当有窗口发送消息过来并且类匹配时，则会触发注册时相应的回调函数
     * send : 用于向指定的目标窗口发送信息
     * unbind : 取消之肖注册的事件
     *
     * 使用demo
     * 现在假设我们有两个frame窗口,一个是主窗口mainFrame ,一个是子窗口childFrame
     * 现在我们得在两个frame窗口中进行消息传递,则我们可以像下面这样操作
     *
     * 1 、 mainFrame传递消息到childFrame
     *    1.1 childFrame注册事件，在childFrame的js代码中
     *    PMS.bind('onload' , function(e){} , '*')
     *    此时childFrame已经注册了消息处理，当有窗口往childFrame消息事，此处注册的回调就会被执行
     *    参数{onload : 消息类型 , function : 回调函数 , '*' : 消息通信的域}
     *
     *    1.2 此时子窗口已准备，等待其它窗口发送消息的到来
     *    此时mainFrame给childFrame发送一个消息
     *    此处写在mainFrame的代码中
     *    PMS.send({
     *        target : frames[0],       //发送到目标窗口
     *        url :                     //URL
     *        type : 'onload' ,         //消息类型
     *        data : {                  //附带数据
     *            name : 'alice' ,
     *            age : 27
     *        },
     *        success : function(){     //成功回调
     *        },
     *        error : function(e){      //失败回调
     *        }
     *    });
     *
     *
     *   其它frame通信跟上面差不多,
     *   多个frame之间也能相互通信，只要通信目标正确即可
     *
     *   如果是子窗口发信息给父窗口，则像下面之样即可
     *   PMS.send({
     *       target : window.parent
     *       其它参数与上面相同
     *   });
     *
     *    target : 必填
     *    type : 必填
     *    其它参数可选
     *
     *    参考
     *    https://developer.mozilla.org/en-US/docs/DOM/window.postMessage
     *    
     *  了解更多可分析下面源码
     *   
 */

(function(glob) {
    var PMS = function(options) {
        pm.send(options);
    };
    PMS.send = PMS;

    PMS.bind = function(type, fn, origin, hash, async_reply) {
        pm.bind(type, fn, origin, hash, async_reply === true);
    };

    PMS.event = {

        onData: function(fn, origin, hash, async_reply) {
            PMS.bind('onData', fn, origin || '*', hash, async_reply);
        },

        onLoad : function(fn, origin, hash, async_reply){
            PMS.bind('onLoad' , fn , origin || '*' , hash , async_reply);
        },

        onDestory :function(fn, origin, hash, async_reply){
            PMS.bind('onDestory' , fn ,  origin || '*' , hash , async_reply);
        },

        onHide : function(fn, origin, hash, async_reply){
            PMS.bind('onHide' , fn ,  origin || '*' , hash , async_reply);
        },

        onShow : function(fn, origin, hash, async_reply){
            PMS.bind('onShow' , fn ,  origin || '*' , hash , async_reply);
        },
        onFullscreen : function(fn, origin, hash, async_reply){
            PMS.bind('onFullscreen' , fn ,  origin || '*' , hash , async_reply);
        }
    };

    PMS.unbind = function(type, fn) {
        pm.unbind(type, fn);
    };

    var extend = function(destination, source) {
        for (var property in source) {
            destination[property] = source[property];
        }
        return destination;
    };

    var pm = {

        send: function(options) {
            var o = extend(pm.defaults, options),
                target = o.target;
            if (!o.target) {
                console.warn("消息目标窗口必须填写!");
                return;
            }
            var msg = {
                data: o.data,
                type: o.type
            };
            if (o.success) {
                msg.callback = pm._callback(o.success);
            }
            if (o.error) {
                msg.errback = pm._callback(o.error);
            }
            if (("postMessage" in target) && !o.hash) {
                pm._bind();
                target.postMessage(JSON.stringify(msg), o.origin || '*');
            }
        },

        bind: function(type, fn, origin, hash, async_reply) {
            pm._replyBind(type, fn, origin, hash, async_reply);
        },

        _replyBind: function(type, fn, origin, hash, isCallback) {
            if (("postMessage" in window) && !hash) {
                pm._bind();
            }
            var l = pm.data("listeners.postmessage");
            if (!l) {
                l = {};
                pm.data("listeners.postmessage", l);
            }
            var fns = l[type];
            if (!fns) {
                fns = [];
                l[type] = fns;
            }
            fns.push({
                fn: fn,
                callback: isCallback,
                origin: origin || $.pm.origin
            });
        },

        unbind: function(type, fn) {
            var l = pm.data("listeners.postmessage");
            if (l) {
                if (type) {
                    if (fn) {
                        var fns = l[type];
                        if (fns) {
                            var m = [];
                            for (var i = 0, len = fns.length; i < len; i++) {
                                var o = fns[i];
                                if (o.fn !== fn) {
                                    m.push(o);
                                }
                            }
                            l[type] = m;
                        }
                    } else {
                        delete l[type];
                    }
                } else {
                    for (var i in l) {
                        delete l[i];
                    }
                }
            }
        },

        data: function(k, v) {
            if (v === undefined) {
                return pm._data[k];
            }
            pm._data[k] = v;
            return v;
        },

        _data: {},

        _generate: function() {
            return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
                var r = Math.random() * 16 | 0,
                    v = c == 'x' ? r : (r & 0x3 | 0x8);
                return v.toString(16);
            });
        },

        _callback: function(fn) {
            var cbs = pm.data("callbacks.postmessage");
            if (!cbs) {
                cbs = {};
                pm.data("callbacks.postmessage", cbs);
            }
            var r = pm._generate();
            cbs[r] = fn;
            return r;
        },

        _bind: function() {
            if (!pm.data("listening.postmessage")) {
                if (window.addEventListener) {
                    window.addEventListener("message", pm._dispatch, false);
                } else if (window.attachEvent) {
                    window.attachEvent("onmessage", pm._dispatch);
                }
                pm.data("listening.postmessage", 1);
            }
        },
        _dispatch: function(e) {
            try {
                var msg = JSON.parse(e.data);
            } catch (ex) {
                console.warn("消息的数据是无效的json", ex);
                return;
            }
            if (!msg.type) {
                console.warn("必须填写对应的消息类型");
                return;
            }
            var cbs = pm.data("callbacks.postmessage") || {},
            cb = cbs[msg.type];
            if (cb) {
                cb(msg.data);
            } else {
                var l = pm.data("listeners.postmessage") || {};
                var fns = l[msg.type] || [];
                for (var i = 0, len = fns.length; i < len; i++) {
                    var o = fns[i];
                    if (o.origin && o.origin !== '*' && e.origin !== o.origin) {
                        console.warn("消息来源不匹配!", e.origin, o.origin);
                        if (msg.errback) {
                            var error = {
                                message: "消息来源不匹配",
                                origin: [e.origin, o.origin]
                            };

                            pm.send({
                                target: e.source,
                                data: error,
                                type: msg.errback
                            });
                        }
                        continue;
                    }

                    function sendReply(data) {
                        if (msg.callback) {
                            pm.send({
                                target: e.source,
                                data: data,
                                type: msg.callback
                            });
                        }
                    }
                    try {
                        if (o.callback) {
                            o.fn(msg.data, sendReply, e);
                        } else {
                            sendReply(o.fn(msg.data, e));
                        }
                    } catch (ex) {
                        if (msg.errback) {
                            pm.send({
                                target: e.source,
                                data: ex,
                                type: msg.errback
                            });
                        } else {
                            throw ex;
                        }
                    }
                };
            }
        }
    };

    pm.defaults = {
        target: null,
        /* 目标窗口 (required) */
        url: null,
        /* 目标窗口URL (optional) */
        type: null,
        /* 消息类型 (required) */
        data: null,
        /* 消息数据 (optional) */
        success: null,
        /* 成功回调 (optional) */
        error: null,
        /* 失败回调 (optional) */
        origin: "*"
        /* 消息域 (optional) */
    }
    var module = module || 'undefined';
    (typeof module != "undefined" && module.exports) ? (module.exports = PMS) : (typeof define != "undefined" ? (define("PMS", [], function() {
        return PMS;
    })) : (glob.PMS = PMS));
})(this);