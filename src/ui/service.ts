import {Spec, SpecEngine} from "./spec";
import {GFileControl} from "./fileControl";
import {UI} from "./main";
import {UFile} from "./server";
import CrossReference from "./graphics/CrossReference";
import GUI from "lil-gui";
import Group from "./graphics/Group";
import BoxSelector from "./graphics/BoxSelector";

export const COLOR_DEFAULT:[number,number,number] = [0.6706,0.8039, 0.9373];
abstract class Service{
    fileControl: GFileControl;
    effectiveDepth: number;
    layer: string;
    rid: string;
    static vidGenerator = 0;
    /**
     * The sid of specs are unique and immutable
     */
    private vidStore = Service.vidGenerator++;
    // Service ID
    get vid(){
        return this.vidStore;
    }
    spec: Spec;
    focusRoot: Spec;
    serviceEngine: ServiceEngine;
    referencable = false;
    constructor(fileControl:GFileControl){
        this.fileControl = fileControl;
        this.serviceEngine = fileControl.serviceEngine;
        this.onFocusChanged = this.onFocusChanged.bind(this);
        this.onFocusChangedProxy = this.onFocusChangedProxy.bind(this);
        // console.log(`Service initiated:`);
        // console.log(this);
    }

    color:[number,number,number] = COLOR_DEFAULT;
    setColor(r: number, g: number, b: number): void {
        this.color = [r, g, b];
        this.spec.colors[this.vid] = [r,g,b];
    }

    referencer: string;

    /**
     * All services should subscribe their own detachment listeners when initialized
     * @param spec
     * @param effectiveDepth
     * @param layer
     * @param referencer
     */
    attach(spec: Spec, effectiveDepth: number, layer: string, referencer: string): void {
        this.spec = spec;
        this.referencer = referencer;
        if(this.serviceEngine.activeServices[spec.sid]==undefined){
            this.serviceEngine.activeServices[spec.sid] = [];
        }
        this.serviceEngine.activeServices[spec.sid].push(this);
        this.effectiveDepth = effectiveDepth;
        this.layer = layer;
        this.rid = `${spec.findChild(referencer)?.compile()}`;
        spec.subscribeChangeService((query, target, event)=>{
            if(query==`${spec.query}/${referencer}`&&event=='v'){
                let prevRid = this.rid;
                this.rid = `${parseInt(target.value)}`;
                if(prevRid!=this.rid){
                    this.onRidChanged(prevRid, this.rid);
                    this.onFocusChangedProxy(focusRoot, focusRoot.focused);
                }
            }
        })
        this.fileControl.services.push(this);
        let focusRoot = spec;
        let unsubscribeList = [focusRoot];
        while(effectiveDepth>0){
            focusRoot = focusRoot?.parent;
            unsubscribeList.push(focusRoot);
            effectiveDepth--;
        }
        this.focusRoot = focusRoot;
        this.focusRoot.subscribeChangeService((query, target, event) => {
            if(event=='cd'&&unsubscribeList.indexOf(target)>=0){
                this.detach();
            }
        });
        focusRoot.subscribeFocusService(this.onFocusChangedProxy);
        this.onFocusChangedProxy(focusRoot,focusRoot.focused);
    }

    crossReferences:{[rid:number]:CrossReference}={};

    detach(){
        delete this.serviceEngine.activeServices[this.spec.sid];
        this.focusRoot.unsubscribeFocusService(this.onFocusChangedProxy);
        this.onFocusChangedProxy(this.focusRoot, false);
    }

    abstract onFocusChanged(spec: Spec, focused:boolean):void;

    /**
     * Overrides focused state inside the proxies when called
     */
    private visibilityOverrideStore:boolean = false;
    set visibilityOverride(overriding: boolean){
        this.visibilityOverrideStore = overriding;
        this.onFocusChangedProxy(this.spec, this.focusRoot.focused);
    }
    /**
     * Invokes on focus changed conditional on layer selection
     * @param spec
     * @param focused
     */
    onFocusChangedProxy(spec: Spec, focused:boolean){
        this.onFocusChanged(spec, this.getFocusProxy(focused));
    }

    abstract onRidChanged(oId: string, nId:string):void;

    getFocusProxy(focused:boolean):boolean{
        let referenced = false;
        for(let key in this.crossReferences){
            referenced||=this.crossReferences[key].getFocusProxy(this.crossReferences[key].focused);
        }
        return (referenced||(this.layer==this.serviceEngine.layer&&focused))||this.visibilityOverrideStore;
    }
}

interface ServiceTemplate{
    service: string;
    referencer: string;
    color?: [number,number,number];
    extends?:string;
    effectiveDepth: number;
    layer: string;
    target?: string|string[];
    colorSet: [number,number,number][];
}

interface ConfigurationTemplate{
    bin: string;
    library: string;
    parameters:ExecutionParameter[];
}
interface ExecutionParameter{
    "param": string,
    "description": string,
    "default": boolean;
}
/**
 * Services are applied in the order that they appear
 */
class ServiceEngine {
    ui: UI;
    serviceTemplates:{[query:string]:ServiceTemplate};
    extendsMapping:{[query: string]:Service[]}={};
    serviceConfig: UFile;
    jsonText: string;
    activeServices: {[sid: number]:Service[]} = {};
    fileControl: GFileControl;
    gui:GUI;
    groups: {[key:string]:Group[]}={};

    binary:string;
    library: string;
    executionParameters:ExecutionParameter[];
    //Preliminary load, generates the service templates based on the service configs
    constructor(ui: UI, fileControl: GFileControl) {
        this.ui = ui;
        this.fileControl= fileControl;
        for (let file of this.ui.fs.fileRoot.children) {//Locate the spec file
            if (file.name == 'ui-bindings.json') {
                this.serviceConfig = file;
                break;
            }
        }
        this.serviceConfig.syncRead((text) => {
            this.jsonText = text
        });
        this.serviceTemplates = JSON.parse(this.jsonText);
        for(let query in this.serviceTemplates){//Apply extensions
            let template = this.serviceTemplates[query];
            if(template.extends){
                let prototype = this.serviceTemplates[template.extends];
                this.serviceTemplates[query] = {...prototype,...template};
                if(!this.extendsMapping[template.extends]){
                    this.extendsMapping[template.extends] = [];
                }
            }
        }
        this.loadConfiguration();
    }

    loadConfiguration(){
        if(this.serviceTemplates['$config']==undefined)
            return;
        //@ts-ignore
        let configuration = <ConfigurationTemplate>this.serviceTemplates['$config'];
        this.binary = configuration.bin;
        this.library = configuration.library;
        this.executionParameters = configuration.parameters;
    }

    executeBinary(){
        let parameters = [];
        for(let parameter of this.executionParameters){
            parameters.push(parameter.param);
        }
        this.ui.vs.openTerminal();
        this.ui.fs.execute(this.binary,this.fileControl.fileReference.url, parameters,(newResponse,resposne)=>{
           this.ui.vs.streamTerminal(newResponse);
        });
    }

    refreshServices(){
        for(let key in this.activeServices){
            let services = this.activeServices[key];
            for(let service of services){
                service.onFocusChangedProxy(service.focusRoot,service.focusRoot.focused);
            }
        }
    }

    /**
     * Controlled values
     */
    layer:string;
    initGUI(gui:GUI){
        this.gui = this.fileControl.canvasController.canvas.gui;
        const serviceFolder = this.gui.addFolder( 'Services' );
        serviceFolder.close();
        function hexToRgbFloat(hex: string): [number, number, number] {
            // Ensure the hex color starts with a '#'
            if (hex.startsWith('#')) {
                hex = hex.slice(1);
            }

            // Convert hex to decimal
            let r: number = parseInt(hex.substring(0, 2), 16);
            let g: number = parseInt(hex.substring(2, 4), 16);
            let b: number = parseInt(hex.substring(4, 6), 16);

            // Convert decimal to float (between 0 and 1)
            return [r / 255.0, g / 255.0, b / 255.0];
        }
        // Services
        const services:{[key:string]:any} = {};
        for(let key in this.serviceTemplates){
            if(key[0]=='$'){
                let serviceName =
                    key.slice(1).split('_').map(value=>`${value[0].toUpperCase()}${value.slice(1)}`).join(' ');
                if(this.serviceTemplates[key].color){
                    let color = this.serviceTemplates[key].color;
                    services[serviceName+' Color'] = `rgb(${Math.floor(color[0]*255)},${Math.floor(color[1]*255)},${Math.floor(color[2]*255)})`;
                    let colorDef = serviceFolder.addColor(services,serviceName+' Color');
                    colorDef.onChange((hex:string)=>{
                        let color = hexToRgbFloat(hex);
                        this.extendsMapping[key].map((service)=>{
                            if(color){
                                service.setColor(color[0],color[1],color[2]);
                            }
                        });
                    })
                }
                services[serviceName+' Visible'] = false;
                let visibility = serviceFolder.add(services, serviceName+' Visible');
                visibility.onChange((visible:boolean)=>{
                    let services = this.extendsMapping[key];
                    for(let service of services){
                        service.visibilityOverride = visible;
                    }
                });
            }
        }
        //Layers
        const layers:string[] = [];
        for(let key in this.serviceTemplates){
            let template = this.serviceTemplates[key];
            if(template.layer!=undefined&&layers.indexOf(template.layer)<0){
                layers.push(template.layer);
            }
        }
        const folderParams = {
            'Display Layer': layers[0]
        };
        this.layer = layers[0];
        let layer = this.gui.add(folderParams,'Display Layer',layers);
        layer.onChange((layer:string)=>{
            this.layer = layer;
            for(let key in this.activeServices){
                let services = this.activeServices[key];
                for(let service of services){
                    service.onFocusChangedProxy(service.focusRoot, service.focusRoot.focused);
                }
            }
        });
        //Id groups
        const idGroupFolder = this.gui.addFolder( 'Reference groups' );
        const groupParams:{[key:string]:boolean|string} = {};
        for(let id in this.groups){
            let group = this.groups[id];
            let service = group[0];
            let gKey = `${service.referencer}: ${service.rid}`;
            groupParams[gKey] = false;
            // let idDef = idGroupFolder.add(groupParams,gKey);
            if(service.color){
                let color = service.color;
                groupParams[`${gKey}-c`] = `rgb(${Math.floor(color[0]*255)},${Math.floor(color[1]*255)},${Math.floor(color[2]*255)})`;
                let colorDef = idGroupFolder.addColor(groupParams,`${gKey}-c`);
                colorDef.onChange((hex:string)=>{
                    let color = hexToRgbFloat(hex);
                    if(color){
                        service.setColor(color[0],color[1],color[2]);
                    }
                })
            }
        }
    }

    getTargetServices(target:string|string[], rid: string){
        let matchedSpecs = [];
        let matchedServices = []
        if(target instanceof Array){
            for(let t of target){
                matchedSpecs.push(...this.fileControl.specRoot.matchChildren(...t.split('/')));
            }
        }else{
            matchedSpecs = this.fileControl.specRoot.matchChildren(...target.split('/'));
        }
        for(let spec of matchedSpecs){
            let services = this.activeServices[spec.sid];
            for(let service of services){
                if(service.rid == rid && service.referencable){
                    matchedServices.push(service);
                }
            }
        }
        return matchedServices;
    }
}
export {Service, ServiceEngine};

export type {ServiceTemplate};