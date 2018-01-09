var crypto = require('crypto');
//MD5加密
var MD5CONFIG= {
    str: 'dasfakjk979l.,..;/912(^)'
}
exports.md5Password=function (password) {
    return crypto.createHash('md5').update(password+MD5CONFIG.str).digest('hex');
}