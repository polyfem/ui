let express = require('express');
let app = express();
let fs = require("fs");
const path = require('path');

function mountFileSystem(rootURL){
    app.get('/ls/:dir', function (req, res) {
        let root = req.params.dir.substring(1);
        let options = {
            headers: {
                'x-timestamp': Date.now(),
                'x-sent': true,
                'Access-Control-Allow-Origin': '*'
            }
        }
        fs.readdir(root, (err, files) => {
            if (err) {
                console.error('Error code: '+ err);
            } else {
                console.log(files);
                // res.set(options);
                let fileList = [];
                for(let i = 0; i<files.length; i++) {
                    let stats =  fs.lstatSync(path.join(root, files[i]));
                    let fileInfo = {
                        "url":path.join(root, files[i]),
                        "name": files[i],
                        "isDir": stats.isDirectory(),
                        "isSymbolicLink": stats.isSymbolicLink()
                    }
                    fileList.push(fileInfo);
                }
                res.append('Access-Control-Allow-Origin', ['*'])
                .send(JSON.stringify(fileList));
            }

        });
    });
    app.get('/getFile/:fileName', function (req, res) {
        let options = {
            root: rootURL,
            dotfiles: 'ignore',
            headers: {
                'x-timestamp': Date.now(),
                'x-sent': true,
                'Access-Control-Allow-Origin': '*'
            }
        }
        let fileName = req.params.fileName;
        console.log(options.root);
        console.log(fileName);
        res.append('Access-Control-Allow-Origin', ['*'])
            .sendFile(fileName, options, function (err) {
            if (err) {
                console.error('Error code: '+ err);
            } else {
                console.log('Sent:', fileName)
            }
        });
    })
}
mountFileSystem("./");
let server = app.listen(8081, function () {
    let host = server.address().address;
    let port = server.address().port;
    console.log("Example app listening at http://%s:%s", host, port);
})