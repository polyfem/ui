import {Spec} from "../spec";
import {MeshPhongMaterial, Vector2, Vector3} from "three";
import * as THREE from "three";
import {Canvas, CanvasController} from "../graphics";
import GeometryController from "./GeometryController";
import Selector from "./Selector";


const vselectionMaterial = new MeshPhongMaterial({color: 0xfbda6f, visible:true,
    side: THREE.DoubleSide, opacity:0.2, transparent:true});

export default class SphereSelector extends Selector{
    helper: THREE.Mesh;
    sphereBoundary: THREE.SphereGeometry;
    /**
     *
     * @param canvasController
     * @param geometryController
     */
    constructor(canvasController: CanvasController, geometryController: GeometryController) {
        super(canvasController, geometryController);
        this.sphereBoundary = new THREE.SphereGeometry(1,100,100)
        this.helper = new THREE.Mesh(this.sphereBoundary, this.selectionMaterial);
        this.helper.visible = false;
        this.meshController.mesh.add(this.helper);
    }

    surfaceSelectionListener(query: string, _: Spec, event: string) {
        let selectionSettings = this.meshController.material.uniforms.selectionBoxes.value;
        let target = this.spec;
        selectionSettings[this.selectionIndex * 4] = new Vector3(-2, 0, 0);
        if (event == 'v') {
            if (target.subNodesCount >= 2) {//Need both center and size to be specified
                let center:number[] = target.children['center'].compile();
                let radius:number = target.children['radius'].compile();
                if (center == undefined || radius == undefined || center.length < 3
                    || isNaN(center[0]) || isNaN(radius) || isNaN(center[1])
                    || isNaN(center[2]))
                    return;
                let meshController = this.meshController;
                let mesh = meshController.mesh;
                let centerVec = new Vector3(center[0]/mesh.scale.x, center[1]/mesh.scale.y, center[2]/mesh.scale.z);
                let sizeVec = new Vector3(Math.abs(radius/mesh.scale.x), Math.abs(radius/mesh.scale.y),Math.abs(radius/mesh.scale.z));
                this.helper.position.set(center[0]/mesh.scale.x, center[1]/mesh.scale.y, center[2]/mesh.scale.z);
                this.helper.scale.set(Math.abs(radius/mesh.scale.x), Math.abs(radius/mesh.scale.y),Math.abs(radius/mesh.scale.z));
                this.helper.updateMatrixWorld();
                selectionSettings[this.selectionIndex * 4] = new Vector3((this.focused)?1:-2, 0, 0);
                selectionSettings[this.selectionIndex * 4 + 1] = centerVec;
                selectionSettings[this.selectionIndex * 4 + 2] = sizeVec;
                //@ts-ignore
                meshController.material.uniforms.selectionBoxes.needsUpdate = true;
            }
        }
    }
    detach(): void {
        let selectionSettings = this.meshController.material.uniforms.selectionBoxes.value;
        selectionSettings[this.selectionIndex * 4] = new Vector3(-2, 0, 0);
        this.meshController.mesh.remove(this.helper);
    }

    onFocusChanged(spec: Spec, focused:boolean): void {
        this.focused = focused;
        this.helper.visible = this.focused;
        this.meshController.selectorSettings[this.selectionIndex * 4] = new Vector3((focused)?1:-2, 0, 0);
    }
}