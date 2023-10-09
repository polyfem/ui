import {Service} from "../service";
import {Spec} from "../spec";
import CrossReference from "./CrossReference";
import {GFileControl} from "../fileControl";

class Group extends CrossReference{

    constructor(fileControl:GFileControl, targets:string|string[]){
        super(fileControl, targets);
    }

    attach(spec: Spec, effectiveDepth: number, layer: string, referencer: string) {
        super.attach(spec, effectiveDepth, layer, referencer);
        let rid = spec.findChild(referencer).value;
        let group = this.serviceEngine.groups[rid];
        if(group == undefined){
            this.serviceEngine.groups[rid] = group = [];
        }
        group.push(this);
    }

    onRidChanged(oId: string, nId: string) {
        let index = this.serviceEngine.groups[oId].indexOf(this);
        this.serviceEngine.groups[oId].splice(index,1);
        this.serviceEngine.groups[nId].push(this);
        super.onRidChanged(oId, nId);
    }
    setColor(r: number, g: number, b: number) {
        for(let group of this.serviceEngine.groups[this.rid]){
            group.color=[r,g,b];
            group.onFocusChangedProxy(group.focusRoot,group.focusRoot.focused);
        }
    }
}

export default Group;