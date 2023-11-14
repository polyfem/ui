import {UFile} from "./server";
import {Canvas, CanvasController} from "./graphics";
import {Spec, SpecEngine} from "./spec";
import {ReactElement} from "react";
import {UI} from "./main";
import {Service, ServiceEngine, ServiceTemplate} from "./service";
import GeometryController from "./graphics/GeometryController";
import Selector from "./graphics/Selector";
import BoxSelector from "./graphics/BoxSelector";
import SphereSelector from "./graphics/SphereSelector";
import PlaneSelector from "./graphics/PlaneSelector";
import AxisSelector from "./graphics/AxisSelector";
import {temp} from "three/examples/jsm/nodes/shadernode/ShaderNodeBaseElements";
import CrossReference from "./graphics/CrossReference";
import {generateBrightMutedColor,generateHighContrastColor} from "./graphics/RandomColor";
import Group from "./graphics/Group";
import FreeSelector from "./graphics/FreeSelector";

class FileControl{
    //Generated uniquely and incrementally
    id: number;
    ui: UI;
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
    specRoot: Spec=new Spec('undefined', undefined);
    constructor(ui: UI,fileName: string, fileReference: UFile){
        this.ui = ui;
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

interface GeometryJSONStruct{
    mesh: string;
    transformation: Transformation;
}
interface Transformation{
    scale: number[] | number;
    translation: number[];
    //Expressed in euler
    rotation: number[];
}



const selectorMapping:{[key:string]: new (c:CanvasController,g:GeometryController)=>Selector} =
    {'box':BoxSelector, 'sphere':SphereSelector,'plane':PlaneSelector, 'axis':AxisSelector, 'wild': FreeSelector}

/**
 * A file that is contains geometries being visualized
 */
class GFileControl extends FileControl{
    canvasController: CanvasController;
    autoSave: boolean = true;
    services: Service[] = [];
    serviceEngine: ServiceEngine;
    fileDisplay2: ReactElement;
    constructor(ui: UI,fileName: string, fileReference: UFile){
        super(ui,fileName, fileReference);
        this.serviceEngine = new ServiceEngine(ui, this);
    }

    loadFile(){
        const hostId = `graphics-${this.id}`;
        this.canvasController = new CanvasController(this.ui,hostId, this);
        if(this.fileReference.extension=='json'){
            this.fileReference.syncRead((data:string)=>{
                let json = JSON.parse(data);
                this.specRoot = this.ui.specEngine.loadAndValidate(json);
                this.specRoot.selected = true;
                this.ui.setSpec(this.specRoot);
                let geometries:GeometryJSONStruct[] = json['geometry'];
                let count = 0;
                geometries.forEach((geometry, index) => this.canvasController.loadGeometry(geometry,index, ()=>{
                    count++;
                    if(count==geometries.length){ // Only way to ensure that bind services gets called after all geometries loaded
                        this.bindServices();
                        this.serviceEngine.initGUI(this.canvasController.canvas.gui);
                    }
                }));
            });
            // Following method times for 0.5 seconds of inactivity
            // New requests increment the waiting key
            // successful update resets it
            let waitingKey = 0;
            console.log(this.specRoot);
            this.specRoot.subscribeChangeService(()=>{
                let key = ++waitingKey;
                console.log(key);
                setTimeout(()=>{
                    if(this.autoSave&&key==waitingKey){
                        //Auto save after 0.5 seconds of inactivity
                        this.saveSpec();
                        waitingKey = 0;
                    }
                }, 500);
            });
        }
        else
            this.canvasController.loadFile(this.fileReference);
    }

    bindServices(){
        for(let query in this.serviceEngine.serviceTemplates){ // Iterate through service template
            let specs = this.specRoot.matchChildren(...query.split('/'));
            let template = this.serviceEngine.serviceTemplates[query];
            for(let spec of specs){ // Find all matching specs
                this.createService(spec, template);// Create corresponding specs
            }
        }
        this.specRoot.subscribeChangeService((query, target, event)=>{
            if(event=='ca'){// ca events attach matching services to spec site,
                            // attaching automatically subscribes detaching actions up to their effective depth.
                for(let serviceQuery in this.serviceEngine.serviceTemplates){
                    if(target.matchesQuery(...serviceQuery.split('/'))){
                        let template = this.serviceEngine.serviceTemplates[serviceQuery];
                        this.createService(target, template);
                    }
                }
            }
        });
    }

    createService(spec: Spec, template: ServiceTemplate){
        let [serviceName, variant] = template.service.split('.');
        switch(serviceName){ // Apply the corresponding services
            case 'selector':
                this.subscribeSelector(spec,template, selectorMapping[variant]);
                break;
            case 'cross reference':
                let cr = new CrossReference(this, template.target);
                cr.attach(spec,template.effectiveDepth,template.layer,template.referencer);
                let color
                    = template.color&&template.color.length==3?template.color:generateBrightMutedColor();
                cr.setColor(...color);
                if(template.extends){
                    this.serviceEngine.extendsMapping[template.extends].push(cr);
                }
                break;
            case 'group':
                let group = new Group(this, template.target instanceof Array?template.target:[template.target]);
                let grColor:[number,number,number];
                if(this.serviceEngine.groups[group.rid]==undefined)
                    grColor = template.color&&template.color.length==3?template.color:generateHighContrastColor();
                else{
                    grColor =this.serviceEngine.groups[group.rid][0].color;
                }
                group.attach(spec,template.effectiveDepth,template.layer,template.referencer);
                group.setColor(...grColor);
                if(template.extends){
                    this.serviceEngine.extendsMapping[template.extends].push(group);
                }
                break;
        }
    }

    subscribeSelector(selectorSpec:Spec, template: ServiceTemplate,
                      T:new (c:CanvasController,g:GeometryController)=>Selector){
        if(T==undefined)
            return;
        let target = selectorSpec.findChild(<string> template.target);
        let geometryControllers = this.canvasController.meshList[target.sid];
        if(geometryControllers==undefined)
            return;
        console.log(geometryControllers);
        for(let geometryController of geometryControllers){
            let selector = new T(this.canvasController, geometryController);
            selector.attach(selectorSpec,template.effectiveDepth,template.layer,template.referencer);
            if(template.color==undefined)
                selector.setColor(0.6706,0.8039, 0.9373);
            else
                selector.setColor(...template.color);
            if(template.extends){
                this.serviceEngine.extendsMapping[template.extends].push(selector);
            }
        }
    };

    saveSpec(){
        console.log("Saving spec");
        if(this.specRoot == undefined)
            return;
        let json = this.specRoot.compile();
        console.log(json);
        if(json!=undefined||'')
            this.fileReference.saveFile(JSON.stringify(json,null,'\t'));
    }

    drawService: FreeSelector;
    setDrawService(drawService:FreeSelector){
        this.drawService = drawService;
    }
    setDrawPlatte: (open:boolean)=>void;
    setRid:(rid:string)=>void;
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

export {FileControl, GeometricOperation, GFileControl, GeometryJSONStruct};