const moment = require('moment')


exports.getUnixTime = function () {
    return parseInt(Date.now() / 1000)
}
exports.getNowDate = function (format = 'YYYY-MM-DD HH:mm:ss') {
    return moment().format(format)
}

exports.dateFormat = function(date,format="YYYY-MM-DD HH:mm:ss"){
    return moment(date).format(format); 
}