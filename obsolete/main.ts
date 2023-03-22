import './graphics';
import {PolyFEM, UFile, UFileSystem} from './server';
import {FilePanel, JSONPanel} from './ui';
import OperationPanel from './OperationPanel';
import {createElement} from "react";
import {createRoot, Root} from "react-dom/client";
import {App} from "./graphics";
import {BasicTabs, CodePanel} from "./editor";
import {FileControl, JSONFileControl} from "./FileControl";

/**
 * Central instance of PolyFEM UI
 */
class Main{
    fs: UFileSystem;
    rootURL = ".";
    fileRoot: Root;
    container: HTMLElement;
    containerRoot: Root;
    operationRoot: Root;
    polyFEM: PolyFEM;
    responseContainer:HTMLElement;
    responseRoot: Root;
    fileNames: string[] = [];
    fileControls: FileControl[]=[];
    /**
     * This is the active file control that is being displayed,
     * using this reference one can insert contents into the active
     * instance
     */
    activeFileControl: FileControl;

    constructor(){
        this.fs = new UFileSystem(this.rootURL);
        this.polyFEM = new PolyFEM();
        console.log(this.fs.fileRoot.url);
        this.loadUI();
        this.executeCommand = this.executeCommand.bind(this);
    }
    loadUI(){
        this.responseContainer = document.createElement('div');
        this.responseContainer.id = 'responsePanel';
        this.responseRoot = createRoot(this.responseContainer);
        //The UFile parameter for console here is purely informational, for now, it is not used by any entities
        let c = new FileControl("console", new UFile("std.out", "console", false),
            this.responseContainer)
        this.fileNames.push("console");
        this.fileControls.push(c);
        this.activeFileControl = c;

        this.container = document.getElementById("container");
        this.containerRoot = createRoot(this.container);
        let props = {tabNames: this.fileNames, tabControls:this.fileControls, initialValue: 0, main: this};
        this.containerRoot.render(createElement(BasicTabs, props));

        let fp = createElement(FilePanel, {'main': this});
        this.fileRoot = createRoot(document.getElementById("filePanel"));
        this.fileRoot.render(fp);


        let configFile = new UFile('./binConfigs.json','binConfigs.json',false);
        configFile.asyncRead((data)=>{
            let op = createElement(OperationPanel, {'main': this, 'configs':JSON.parse(data)});
            this.operationRoot = createRoot(document.getElementById("rightPanel"));
            this.operationRoot.render(op);
        });
    }

    /**
     * Inform the instance of file control corresponding to the
     * opened file currently displayed
     * @param index
     */
    setActive(index: number){
        this.activeFileControl = this.fileControls[index];
        if(this.activeFileControl instanceof JSONFileControl){
            let op = createElement(OperationPanel, {'main': this});
            this.operationRoot.render(op);
        }
    }
    refreshFilePanel(){
        let fp = createElement(FilePanel, {'main': this});
        this.fileRoot.render(fp);
    }
    loadFile(file: UFile){
        let index = this.getFileIndex(file);
        if(index!=-1){
            let props = {tabNames: this.fileNames, tabControls: this.fileControls, initialValue: index, main: this};
            this.containerRoot.render(createElement(BasicTabs, props));
        }else{
            let fileControl = this.getFileDisplay(file);
            if(fileControl == undefined)
                return;
            this.fileNames.push(file.name);
            this.fileControls.push(fileControl);
            let props = {tabNames: this.fileNames, tabControls: this.fileControls,
                initialValue: this.fileControls.length-1, main: this};
            this.containerRoot.render(createElement(BasicTabs, props));
        }
    }
    getFileIndex(file: UFile):number{
        for(let i = 0; i < this.fileControls.length; i++){
            if(this.fileControls[i].fileReference === file){
                return i;
            }
        }
        return -1;
    }
    getFileDisplay(file: UFile):FileControl{
        let extension = file.name.split('.').pop();
        switch(extension){
            case "obj":
            case "glb":
            case "vtu":
            case "msh":
                let canvas = new App();
                switch(extension){
                    case "obj":
                        canvas.loadMesh(file.url);
                        break
                    case "glb":
                        canvas.loadObject(file.url);
                        break;
                    case "vtu":
                    case "msh":
                        canvas.loadConvertObj(file.url);
                }
                return new FileControl(file.name, file, canvas.dom);
            case "json":
                let control = new JSONFileControl(file.name, file);
                control.togglePane = true;
                return control;
            case "py":
            case "js":
                let container2 = document.createElement("div");
                container2.className = "codePanel";
                let root2 = createRoot(container2);
                file.asyncRead((text:string)=>{
                    let cp = createElement(CodePanel, {'code': text, 'language':'javascript',
                        'readonly':false});
                    root2.render(cp);
                })
                return new FileControl(file.name, file, container2);
        }
        return undefined;
    }
    updateJSON(json:{}){
        console.log(json);
    }
    loadFileRoot():UFile{
        return this.fs.fileRoot;
    }
    executeCommand(bin: string, command: string, params: string[], callback: (newResponse: any, response: any)=>void){
        this.polyFEM.execute(bin, command, params, callback);
    }
    setResponse(response: string){
        let cp = createElement(CodePanel, {'code': response, 'language':'javascript',
                'readonly':true});
        this.responseRoot.render(cp);
    }
}

new Main();

export {Main};