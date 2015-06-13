var http = require("http");

var getJSON = function(options, onResult){
    var req = http.request(options, function(res)
    {
        var output = '';
        res.setEncoding('utf8');
        res.on('data', function (chunk) {
            output += chunk;
        });
        res.on('end', function() {
            var obj = JSON.parse(output);
            onResult(res.statusCode, obj);
        });
    });
    req.on('error', function(err) {
        res.send('error: ' + err.message);
    });
    req.end();
};

exports.getJSON = getJSON;
