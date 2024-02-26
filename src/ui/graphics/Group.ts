import {COLOR_DEFAULT, Service} from "../service";
import {Spec} from "../spec";
import CrossReference from "./CrossReference";
import {GFileControl} from "../fileControl";
import {generateHighContrastColor} from "./RandomColor";

class Group extends CrossReference{

    constructor(fileControl:GFileControl, targets:string|string[]){
        super(fileControl, targets);
    }

    attach(spec: Spec, effectiveDepth: number, layer: string, referencer: string) {
        super.attach(spec, effectiveDepth, layer, referencer);
        let rid = `${parseInt(spec.findChild(referencer).value)}`;
        if(rid=='NaN'){
            return;
        }
        let group = this.serviceEngine.groups[rid];
        if(group == undefined){
            this.serviceEngine.groups[rid] = group = [];
        }
        group.push(this);
    }

    /**
     * Relocate service group and switch self color when adjusted to another group;
     * if new RID is undefined, this group is given the color default, otherwise
     * color is matched to the new groups color
     * @param oId
     * @param nId
     */
    onRidChanged(oId: string, nId: string) {
        super.onRidChanged(oId, nId);
        if(oId!='NaN'&&this.serviceEngine.groups[oId]!=undefined){ // Remove self from previous group
            let index = this.serviceEngine.groups[oId].indexOf(this);
            this.serviceEngine.groups[oId].splice(index,1);
        }
        if(nId!='NaN'){// Locate self in new group
            if(this.serviceEngine.groups[nId]==undefined||this.serviceEngine.groups[nId].length==0){
                this.serviceEngine.groups[nId] = [];
                super.setColor(...generateHighContrastColor()); // Generate new color for new group(s)
            }else{
                super.setColor(...this.serviceEngine.groups[nId][0].color); // Otherwise use color of the group
            }
            this.serviceEngine.groups[nId].push(this);
        }else{ // If no ID defined, use color default
            super.setColor(...COLOR_DEFAULT);
        }
    }
    setColor(r: number, g: number, b: number) {
        if(this.rid==undefined||this.rid=='NaN'){
            return;
        }
        for(let group of this.serviceEngine.groups[this.rid]){
            group.color=[r,g,b];
            group.spec.colors[group.vid] = [r,g,b];
            group.onFocusChangedProxy(group.focusRoot,group.focusRoot.focused);
        }
    }
}

export default Group;