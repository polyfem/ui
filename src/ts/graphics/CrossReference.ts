import {Service} from "../service";
import {Spec, SpecEngine} from "../spec";
import {GFileControl} from "../fileControl";
import Selector from "./Selector";

/**
 * CrossReference is now only allowed to be applied to Selectors but not other services
 * to avoid circular dependency. In general, only services that implements the reference-dereference
 * methods can be referenced by this service.
 */
export default class CrossReference extends Service{
    constructor(fileControl:GFileControl, target:string|string[]){
        super(fileControl);
        this.target = target;
    }
    attach(spec: Spec, effectiveDepth: number, layer: string, referencer: string) {
        super.attach(spec, effectiveDepth, layer, referencer);
    }

    focused: boolean = false;
    /**
     * Query string for referenced targets
     */
    target: string|string[];
    onFocusChanged(spec: Spec, focused: boolean): void {
        this.focused=focused;
        for(let service of this.serviceEngine.getTargetServices(this.target, this.rid)){
            if(service instanceof Selector)//Exclude other services
                service.reference(this);
        }
    }
    setColor(r:number,g:number,b:number){
        super.setColor(r,g,b);
        this.onFocusChangedProxy(this.focusRoot,this.focusRoot.focused);
    }

    onRidChanged(oId: string, nId: string) {
        for(let service of this.serviceEngine.getTargetServices(this.target, oId)){
            if(service instanceof Selector)//Exclude other services
                service.dereference(this);
        }
        for(let service of this.serviceEngine.getTargetServices(this.target, nId)){
            if(service instanceof Selector)//Exclude other services
                service.reference(this);
        }
    }
}