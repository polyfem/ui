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
}

class PolyFEM{

}

class Operator{

}

export {UFile, UFileSystem, PolyFEM, Operator}