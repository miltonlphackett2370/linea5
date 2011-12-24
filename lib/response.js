var fs = require("fs"),
    url = require("url"),
    mimes = require('./mimes').mimes,
    utils = require('./utils'),
    httpStatus = require('./httpstatus').status,
    pathmo = require('path');
var expires = {
    fileMatch: /^(gif|png|jpg|js|css)$/ig,
    maxAge: 60*60*24*365
};
var send404 = function (res) {
        res.send(exports.page404);
    };
module.exports = function (res, req) {
    //res
    /*
     * @description Send a data to client. 发送数据到客户端 
     * @param {String} data Data to send(require) 发送的数据* 
     */
    res.long = function () {
        this.writeHead(200, {'Content-type' : 'text/html'});
        this.send = function (data) {
            this.write(data);
        };
        return this;
    };
    res.send = function (data) {
        this.writeHead(200, {'Content-type' : 'text/html'});
        this.write(data);
        res.end();
        return this;
    };
    res.sendError = function (statu) {
        res.writeHead(statu, {'Content-Type': "text/plain"});
        res.end(httpStatus[String(statu)]);
        return this;
    };
    /*
     * @description Send a file to client. 发送指定文件到客户端
     * @param {String} fileName Specify file name to send.(require) 需要发送的文件的文件名(不包括文件名前端的'/');*
     */
    res.sendFile = function (fileName) {
        fs.stat(fileName, function (err, stats) {
            if (err) return res.sendError(404);
            var size = stats.size,
                format = pathmo.extname(fileName),
                fileStream = fs.createReadStream(fileName),
                lastModified = stats.mtime.toUTCString();
            format = format ? format.slice(1) : 'unknown';
            this.charset = mimes[format] || "text/plain";
            if (format.match(expires.fileMatch)) {
                var expires1 = new Date();
                expires1.setTime(expires1.getTime() + expires.maxAge * 1000);
                res.setHeader("Expires", expires1.toUTCString());
                res.setHeader("Cache-Control", "max-age=" + expires.maxAge);
            }
            if (req.headers['If-Modified-Since'] && lastModified == request.headers['If-Modified-Since']) res.sendError(304);
            res.writeHead(200, {'Content-Type' : this.charset, 'Last-Modified': lastModified, 'Content-Length': size});
            fileStream.pipe(res);
        });
    };
    /*
     * @description Send a JSON String to client. 发送JSON数据到客户端
     * @param {Array} data A data to send, it can be Array, Object or String.(require) 需要发送的数据，可以是Array, Object或是已经编码的JSON字符串*
     */
    res.sendJSON = function (data) {
        switch (typeof data) {
            case "string":
                this.charset = "application/json";
                res.writeHead(200, {'Content-Type' : this.charset});
                res.write(data);
                res.end();
                break;
            case "array":
            case "object":
                var sJSON = JSON.stringify(data);
                this.charset = "application/json";
                res.writeHead(200, {'Content-Type' : this.charset});
                res.write(sJSON);
                res.end();
                break;
        }
    };
    /*
     * @description Send a JSON String to client, and then run the callback. 发送JSONP数据到客户端，然后让客户端执行回调函数。
     * @param {Array} data A data to send, it can be Array, Object or String.(require) 需要发送的数据，可以是Array, Object或是已经编码的JSON字符串*
     */
    res.sendJSONP = function (data) {
        switch (typeof data) {
            /*
             * JSON string data.
             */
            case "string":
                this.charset = "application/json";
                res.writeHead(200, {'Content-Type' : this.charset});
                res.write(req.qs.callback + '(' + data + ')');
                res.end();
                break;
            /*
             * Array or Object
             */
            case "array":
            case "object":
                var sJSON = JSON.stringify(data);
                this.charset = "application/json";
                res.writeHead(200, {'Content-Type' : this.charset});
                res.write(req.qs.callback + '(' + sJSON + ')');
                res.end();
                break;
        }
    };
    /*
     * @description Redirect the client to specify url ,home, back or refresh. 使客户端重定向到指定域名，或者重定向到首页，返回上一页，刷新。
     * @param {String} url Specify url ,home, back or refresh.(require) 指定的域名，首页，返回或刷新。*
     */
    res.redirect = function (url) {
        switch (url) {
            /*
             * Redirect to home.
             */
            case 'home':
                res.writeHead(302, {'Location': url.parse(req.url).hostname});
                res.end();
                console.log('Redirected to home');
                break;
            /*
             * Back to the previous page.
             */
            case 'back':
                res.send('javascript:history.go(-1)');
                res.writeHead(302, {'Location': 'javascript:history.go(-1)'});
                res.end();
                console.log('Redirected to back');
                break;
            /*
             * Refresh the client.
             */
            case 'refresh':
                res.writeHead(302, {'Location': req.url});
                res.end();
                console.log('Refresh the client');
                break;
            /*
             * Redirected to specify url.
             */
            default:
                if (/^\//i.test(url) && !/^http/i.test(url)) url = req.host + url;
                res.writeHead(302, {'Location': url});
                res.end();
                console.log('Refresh to ' + url);
        }
        return this;
    };
    /*
     * @description Set a cookies on the client. 在客户端设置cookies
     * @param {String} name name of the cookies.(require) cookies的名字*
     * @param {String} val content of the cookies.(require) cookies的数据*
     * @param {Object} options Detail options of the cookies. cookies的详细设置
     */
    res.setCookie = function (name, val, options) {
        if (typeof options != 'object')
            options = {};
        if (typeof options.path != 'string')
            options.path = '/';
        if (!(options.expires instanceof Date))
            options.expires = new Date();
        if (isNaN(options.maxAge))
            options.maxAge = 0;
        options.expires.setTime(options.expires.getTime() + options.maxAge * 1000);
        var cookie = utils.serializeCookie(name, val, options);
        var oldcookie = this.getHeader('Set-Cookie');
        if (typeof oldcookie != 'undefined')
            cookie = oldcookie + '\r\nSet-Cookie: ' + cookie;
        this.setHeader('Set-Cookie', cookie);
        return this;
    };
    res.cookie = res.setCookie;
    /*
     * @decription Claer the specify cookies. 清除某指定cookies
     * @param {String} name Name of the cookies to clear.(require) 需要清除的cookies的名字*
     * @param {Object} options Detail options of the cookies. cookies的详细设置
     */
    res.clearCookie = function (name, options) {
        this.cookie(name, '', options);
        return this;
    };
    res.setHeader('Date', new Date().toUTCString());
    res.setHeader('Server', 'Node.js with webjs');
    res.setHeader('Accept-Ranges', 'bytes');
}