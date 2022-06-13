let express = require('express');
let app = express();
let fs = require("fs");
const path = require('path');

app.get('/getMesh/:meshName', function (req, res) {
    let options = {
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
    });
})

let server = app.listen(8081, function () {
    let host = server.address().address;
    let port = server.address().port;
    console.log("Example app listening at http://%s:%s", host, port);
})