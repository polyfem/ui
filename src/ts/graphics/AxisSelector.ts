import {MeshPhongMaterial, Vector3} from "three";
import * as THREE from "three";
import Selector from "./Selector";
import PlaneSelector from "./PlaneSelector";
import {Spec} from "../spec";

const selectionMaterial = new MeshPhongMaterial({color: 0xabcdef, visible:true,
    side: THREE.DoubleSide, opacity:0.2, transparent:true});

export default class AxisSelector extends PlaneSelector{

    surfaceSelectionListener(query: string, target: Spec, event: string) {
        let selectionSettings = this.meshController.material.uniforms.selectionBoxes.value;
        selectionSettings[this.selectionIndex * 3] = new Vector3(this.isSurfaceSelector?2:5, 0, 0);
        if (event == 'v') {
            if (target.subNodesCount >= 2) {//Need both center and size to be specified
                let axis:number = this.ui.specEngine.compile(target.children['axis']);
                let position:number = this.ui.specEngine.compile(target.children['position']);
                if (axis == undefined || position == undefined|| [0,1,2].indexOf(axis)<0 || isNaN(position))
                    return;
                let meshController = this.meshController;
                let mesh = meshController.mesh;
                let normal= [(axis==0)?1:0,axis==1?1:0,axis==2?1:0];
                let p = new Vector3((axis==0)?position:0,axis==1?position:0,axis==2?position:0);
                console.log(p);
                let z = new Vector3(normal[0], normal[1],normal[2]).normalize();
                let x = new Vector3(normal[1],-normal[0],0);
                x = (x.length()==0)?new Vector3(1,0,0):x.normalize();
                let y = new Vector3().crossVectors(z,x);
                let sx = mesh.scale.x, sy = mesh.scale.y, sz = mesh.scale.z;
                this.helper.matrix.set( x.x/sx, y.x/sx, z.x/sx, p.x/sx,
                    x.y/sy, y.y/sy, z.y/sy, p.y/sy,
                    x.z/sz, y.z/sz, z.z/sz, p.z/sz,
                    0,0,0,1);
                this.helper.updateMatrixWorld();
                selectionSettings[this.selectionIndex * 3 + 1] = p;
                z.multiply(meshController.mesh.scale);
                selectionSettings[this.selectionIndex * 3 + 2] = z;
                //@ts-ignore
                meshController.material.uniforms.selectionBoxes.needsUpdate = true;
            }
        }
    }
}