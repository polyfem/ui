import * as $ from "jquery";
import "path";

class UFileSystem{
    fileRoot: UFile;
    rootURL: string;
    constructor(rootURL: string){
        this.rootURL = rootURL;
        this.fileRoot = new UFile(rootURL,
            rootURL.substring(rootURL.lastIndexOf('/')+1), true);
        this.fileRoot.ls();
    }
    getFile(dir:UFile, filename: string):UFile{
        return undefined;
    }
    getRoot(): UFile{
        return this.fileRoot;
    }
}

class PolyFEM{

    /**
     * Executes the command by passing the server the json,
     * opens a stream for service updates
     */
    execute(callback:(newResponse, response)=>void): void{
        let last_response_len = -1;
        $.ajax({
            url: 'http://localhost:8081/execute',
            type: 'PUT',
            xhrFields:{
                onprogress: function(e)
                {
                    let this_response, response = e.currentTarget.response;
                    if(last_response_len === -1)
                    {
                        this_response = response;
                        last_response_len = response.length;
                    }
                    else
                    {
                        this_response = response.substring(last_response_len);
                        last_response_len = response.length;
                    }
                    callback(this_response, response);
                }
            },
            success: function(result) {
                console.log(result);
            }
        });
    }
}

class UFile{
    url: string;
    name: string;
    isDir: boolean = false;
    children: UFile[] = [];
    constructor(url: string, name: string, isDir){
        this.url = url;
        this.name = name;
        this.isDir = isDir;
    }
    ls(){
        if(!this.isDir)
            return;
        $.getJSON({
            type: "GET",
            url: "http://localhost:8081/ls/%22"+this.url,
            async: false
        }, (data)=>{
            let dirList:[{
                "url": string,
                "name": string,
                "isDir": boolean,
                "isSymbolicLink": boolean
            }] = data;
            this.children = [];
            for(let dir of dirList){
                this.children.push(new UFile(dir.url, dir.name, dir.isDir))
            }
        });
    }

    asyncRead(param: (data) => void) {
        let  fileName = this.url.replace("\\", "%2F")
        .replace("/", "%2F");
        $.get('http://localhost:8081/getFile/'+fileName, function(data) {
            param(data);
        }, 'text');
    }
}

class Operator{

}

export {UFile, UFileSystem, PolyFEM, Operator}