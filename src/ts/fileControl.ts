import {UFile} from "./server";
import {Canvas, CanvasController} from "./graphics";
import {Spec} from "./spec";
import {ReactElement} from "react";

class FileControl{
    //Generated uniquely and incrementally
    id: number;
    static idGenerator: number = 0;
    //Opened instances of file control
    static instances:{[key:number]:FileControl} = {};
    fileName: string;
    fileReference: UFile;
    fileExtension: string;
    fileDisplay: ReactElement;
    alternativeDisplay: HTMLElement;
    togglePane = false;
    //Root of the spec, defaults to undefined for non-JSON files
    specRoot: Spec=new Spec('undefined');
    constructor(fileName: string, fileReference: UFile){
        this.id = FileControl.idGenerator;
        FileControl.instances[this.id] = this;
        FileControl.idGenerator++;
        this.fileName = fileName;
        this.fileReference = fileReference;
        this.fileExtension = fileName.split('.').pop();
    }
}


/**
 * Provides the basic structure of a geometric operation
 * for storage purpose
 */
class GeometricOperation{
    geometryID: string;
    operation: string;
    parameters: number[];
    constructor(geometryID: string) {
        this.geometryID = geometryID
    }
}

/**
 * A file that is contains geometries being visualized
 */
class GFileControl extends FileControl{
    canvasController: CanvasController;
    constructor(fileName: string, fileReference: UFile){
        super(fileName, fileReference);
    }
    loadFile(){
        this.canvasController.loadFile(this.fileReference);
    }
}

// class JSONFileControl extends FileControl{
//     json: {};
//     jsonRoot: Root;
//     canvas: App;
//
//     revertStack: GeometricOperation[] = [];
//     redoStack: GeometricOperation[] = [];
//
//     constructor(fileName: string, fileReference: UFile){
//         super(fileName, fileReference);
//
//         this.initializeViewers();
//         this.jsonUpdated = this.jsonUpdated.bind(this);
//     }
//
//     private initializeViewers() {
//         let container = document.createElement("div");
//         container.className = "jsonPanel tabFrame";
//         this.jsonRoot = createRoot(container);
//         this.canvas = new App();
//         let dir = this.fileReference.url.split('/')[0];
//
//         this.fileReference.asyncRead((text:string)=>{
//             this.json = JSON.parse(text);
//             this.jsonRoot.render(createElement(JSONPanel, {'json':this.json, 'control': this}))
//             this.canvas.loadScene(dir, this.json, (operation: GeometricOperation)=>{
//                 this.revertStack.push(operation);
//                 console.log(this.revertStack);
//                 this.redoStack.length = 0;
//                 createElement(JSONPanel, {'json':this.json, 'control': this});
//                 this.fileReference.saveFile(JSON.stringify(this.json,null,'\t'));
//             }, ()=>{
//                 let operation = this.revertStack.pop();
//                 console.log(this.revertStack);
//                 this.redoStack.push(operation);
//                 this.revert(operation);
//                 this.fileReference.saveFile(JSON.stringify(this.json,null,'\t'));
//                 createElement(JSONPanel, {'json':this.json, 'control': this});
//                 this.jsonUpdated(this.json);
//             }, ()=>{
//                 let operation = this.redoStack.pop();
//                 this.revertStack.push(operation);
//                 this.redo(operation);
//                 this.fileReference.saveFile(JSON.stringify(this.json,null,'\t'));
//                 createElement(JSONPanel, {'json':this.json, 'control': this});
//                 this.jsonUpdated(this.json);
//             });
//         });
//         this.fileDisplay = this.canvas.dom;
//         this.alternativeDisplay = container;
//     }
//
//     /**
//      * Reverts the most given operation
//      * @private
//      */
//     private revert(operation: GeometricOperation){
//         let geometry = this.json['geometry'][operation.geometryID];
//         let parameters = operation.parameters;
//         switch(operation.operation){
//             case 'position':
//                 let orgPos = geometry.transformation.translation;
//                 geometry.transformation.translation = [orgPos[0]-parameters[0], orgPos[1]-parameters[1],
//                     orgPos[2]-parameters[2]];
//                 break;
//             case 'scale':
//                 let orgScale = geometry.transformation.scale;
//                 geometry.transformation.scale = [orgScale[0]-parameters[0], orgScale[1]-parameters[1],
//                     orgScale[2]-parameters[2]];
//                 break;
//         }
//     }
//
//     private redo(operation: GeometricOperation){
//         let geometry = this.json['geometry'][operation.geometryID];
//         let parameters = operation.parameters;
//         switch(operation.operation){
//             case 'position':
//                 let orgPos = geometry.transformation.translation;
//                 geometry.transformation.translation = [orgPos[0]+parameters[0], orgPos[1]+parameters[1],
//                     orgPos[2]+parameters[2]];
//                 break;
//             case 'scale':
//                 let orgScale = geometry.transformation.scale;
//                 geometry.transformation.scale = [orgScale[0]+parameters[0], orgScale[1]+parameters[1],
//                     orgScale[2]+parameters[2]];
//                 break;
//         }
//     }
//
//     public jsonUpdated(json:{}) {
//         this.json = json;
//         this.canvas.updateJSON(json);
//     }
//
//     public insertGeometry(file:UFile){
//         this.canvas.insertJSONGeometry(file, ()=>{
//             this.fileReference.saveFile(JSON.stringify(this.json,null,'\t'));});
//     }
// }

export {FileControl, GeometricOperation, GFileControl};