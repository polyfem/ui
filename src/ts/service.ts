import {Spec, SpecEngine} from "./spec";
import {GFileControl} from "./fileControl";
import {UI} from "./main";
import {UFile} from "./server";
import CrossReference from "./graphics/CrossReference";
import GUI from "lil-gui";

abstract class Service{
    fileControl: GFileControl;
    effectiveDepth: number;
    layer: string;
    rid: number;
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
        console.log(`Service initiated:`);
        console.log(this);
    }

    color = [0.6706,0.8039, 0.9373];
    setColor(r: number, g: number, b: number): void {
        this.color = [r, g, b];
    }

    /**
     * All services should subscribe their own detachment listeners when initialized
     * @param spec
     * @param effectiveDepth
     * @param layer
     * @param referencer
     */
    attach(spec: Spec, effectiveDepth: number, layer: string, referencer: string): void {
        this.spec = spec;
        this.serviceEngine.activeServices[spec.sid]=this;
        this.effectiveDepth = effectiveDepth;
        this.layer = layer;
        this.rid = spec.findChild(referencer)?.compile();
        spec.subscribeChangeService((query, target, event)=>{
            if(query==`${spec.query}/${referencer}`&&event=='v'){
                this.rid = target.value;
            }
            this.onFocusChangedProxy(focusRoot, focusRoot.focused);
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

    referencer:{[rid:number]:CrossReference}={};
    /**
     * Must be idempotent
     * @param referencer
     */
    reference(referencer: CrossReference){
        this.referencer[referencer.vid] = referencer;
    }

    /**
     * Must be idempotent
     */
    dereference(referencer: CrossReference){
        delete this.referencer[referencer.vid];
    };
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

    getFocusProxy(focused:boolean):boolean{
        let referenced = false;
        for(let key in this.referencer){
            console.log(this.referencer[key].spec.query);
            console.log(this.referencer[key].focused);
            referenced||=this.referencer[key].getFocusProxy(this.referencer[key].focused);
        }
        return (referenced||this.visibilityOverrideStore||focused)&&this.layer==this.serviceEngine.layer;
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

/**
 * Services are applied in the order that they appear
 */
class ServiceEngine {
    ui: UI;
    serviceTemplates:{[query:string]:ServiceTemplate};
    extendsMapping:{[query: string]:Service[]}={};
    serviceConfig: UFile;
    jsonText: string;
    activeServices: {[sid: number]:Service} = {};
    fileControl: GFileControl;
    gui:GUI;
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
    }

    /**
     * Controlled values
     */
    layer:string;
    intGUI(gui:GUI){
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
                let service = this.activeServices[key];
                service.onFocusChangedProxy(service.spec, service.spec.focused);
            }
        })
    }

    getTargetServices(target:string|string[], rid: number){
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
            let service = this.activeServices[spec.sid];
            if(service.rid == rid && service.referencable){
                matchedServices.push(service);
            }
        }
        return matchedServices;
    }
}
export {Service, ServiceTemplate, ServiceEngine};