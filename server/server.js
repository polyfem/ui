let express = require('express');
let app = express();
let fs = require("fs");
const path = require('path');
const { execSync, spawn } = require('child_process');
const cors = require('cors');

function mountFileSystem(rootURL){
    app.get('/ls/:dir', function (req, res) {
        let root = req.params.dir;
        console.log(root);
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
            dotfiles: 'ignore',
            headers: {
                'x-timestamp': Date.now(),
                'x-sent': true,
                'Access-Control-Allow-Origin': '*'
            }
        }
        let fileName = req.params.fileName;
        console.log(path.resolve(path.join(rootURL, fileName)));
        res.append('Access-Control-Allow-Origin', ['*'])
            .sendFile(path.resolve(fileName), options, function (err) {
            if (err) {
                console.error('Error code: '+ err);
            } else {
                console.log('Sent:', fileName)
            }
        });
    })
    app.use(cors({
        origin: '*'
    }));
    app.get('/mesh-convert/:orgFileURL/:targetFileName', function (req, res) {
        let orgURL = req.params['orgFileURL'];
        let targetName = req.params['targetFileName'];
        let dir = path.dirname(orgURL);
        let joinedName = path.join(dir,`$`+targetName);
        let fullName = joinedName.replace("\\", "%2F")
            .replace("/", "%2F");
        let targetURL = path.join('temp', fullName);
        let options = {
            root: rootURL,
            dotfiles: 'ignore',
            headers: {
                'x-timestamp': Date.now(),
                'x-sent': true,
                'Access-Control-Allow-Origin': '*'
            }
        }
        let command = `python mesh-convert.py ${orgURL} ${targetURL}`
        execSync(command);
        res.sendFile(targetURL, options, function (err) {
            if (err) {
                console.error('Error code: '+ err);
            } else {
                console.log('Sent:', targetURL)
            }
        });
    });
    app.put('/execute/:bin/:target/:params', function (req, res) {
        let target = req.params['target'];
        let params = JSON.parse(req.params['params']);
        console.log(params);
        let bin = req.params['bin'];
        // let command = path.join(rootURL, 'bin', 'polyfem.exe');
        params.push(decodeURI(target));
        let child = spawn(bin, params);
        child.stdout.pipe(res);
        // Equivalently for pipe():
        // child.stdout.on('data', function(data) {
        //         res.write(data);
        //     });
        // child.stdout.on('end', function() {
        //         res.end();
        //     });
        // child.stderr.on('data',data => {
        //     console.error(`stderr: ${data}`);
        // });
    });
    app.post('/writeFile/:fileName', (req) => {
        console.log(req.params.fileName);
        const fileName = path.join(rootURL, req.params.fileName);
        const stream = fs.createWriteStream(fileName);
        stream.on('open', () => req.pipe(stream));
    });
}

mountFileSystem("./");
let server = app.listen(8081, function () {
    let host = server.address().address;
    let port = server.address().port;
    console.log("Example app listening at http://%s:%s", host, port);
})