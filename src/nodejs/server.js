var express = require('express');
var app = express();
var fs = require("fs");
const path = require('path');

app.get('/getMesh/:meshName', function (req, res) {
    var options = {
        root: path.join(__dirname, 'data'),
        dotfiles: 'ignore',
        headers: {
            'x-timestamp': Date.now(),
            'x-sent': true,
            'Access-Control-Allow-Origin': '*'
        }
    }

    let fileName = req.params.meshName;
    console.log(fileName);
    res.sendFile(fileName, options, function (err) {
        if (err) {
            console.error('Error code: '+ err);
        } else {
            console.log('Sent:', fileName)
        }
    })
})

var server = app.listen(8081, function () {
    var host = server.address().address;
    var port = server.address().port;
    console.log("Example app listening at http://%s:%s", host, port);
})