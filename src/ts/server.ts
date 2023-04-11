import $ from "jquery";

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
    execute(bin: string, command: string, params: string[], callback:(newResponse: string, response: string)=>void): void{
        let last_response_len = -1;
        //@ts-ignore
        $.ajax({
            url: 'http://localhost:8081/execute/'+encodeURIComponent(bin)+'/'+encodeURIComponent(command)+
            '/'+encodeURIComponent(JSON.stringify(params)),
            type: 'PUT',
            xhrFields:{
                onprogress: function(e:any)
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
            success: function(result:string) {
                console.log(result);
            }
        });
    }
}

interface UInf{
    url: string;
    name: string;
    isDir:boolean;
    isSymbolicLink: boolean;
}

class UFile{
    url: string;
    name: string;
    isDir: boolean = false;
    children: UFile[] = [];
    extension: string;
    constructor(url: string, name: string, isDir: boolean){
        this.url = url;
        this.extension = this.url.split('.').pop();
        this.name = name;
        this.isDir = isDir;
    }
    ls(){
        if(!this.isDir)
            return false;
        let success = false;
        //@ts-ignore
        $.getJSON({
            type: "GET",
            url: `http://localhost:8081/ls/${encodeURIComponent(this.url)}`,
            async: false
        }, (data: UInf[])=>{
            let dirList:UInf[] = data;
            this.children = [];
            for(let dir of dirList){
                this.children.push(new UFile(dir.url, dir.name, dir.isDir))
            }
            success = true;
        });
        return success;
    }

    asyncRead(param: (data:string) => void) {
        let  fileName = encodeURIComponent(this.url);
        $.get('http://localhost:8081/getFile/'+fileName, function(data) {
            param(data);
        }, 'text');
    }

    syncRead(param: (data:string) => void) {
        let  fileName = encodeURIComponent(this.url);
        //@ts-ignore
        $.get({
            type: 'GET',
            url: 'http://localhost:8081/getFile/'+fileName,
            async: false
        }, function(data: string) {
            param(data);
        }, 'text');
    }

    saveFile(data: string){
        let req = $.ajax({
            url: 'http://localhost:8081/writeFile/'+encodeURIComponent(this.url),
            method: 'POST',
            data: data, // sends fields with filename mimetype etc
            // data: aFiles[0], // optional just sends the binary
            processData: false, // don't let jquery process the data
            contentType: false // let xhr set the content type
        });
    }

    /**
     * Creates a URL from which contents of this file can be accessed through,
     * deals with file type conversions here depending on the geometric file format
     */
    accessURL(){
        switch(this.extension){
            case 'glb':
            case 'gltf':
            case 'obj':
                return 'http://localhost:8081/queryFile/?address=./'+this.url;
            case 'msh':
            case 'vtu':
                let nameComponents = this.name.split('.');
                nameComponents.pop();
                nameComponents.push('obj');
                let name = encodeURIComponent(nameComponents.join('.'));
                return `http://localhost:8081/mesh-convert/${encodeURIComponent(this.url)}/${name}`;
        }
    }
}

class Operator{

}

export {UFile, UFileSystem, PolyFEM, Operator}