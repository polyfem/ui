import {Spec} from "../spec";
import THREE, {GeometryUtils, Mesh, Vector2, Vector3} from "three";
import {Canvas, CanvasController} from "../graphics";
import GeometryController from "./GeometryController";
import Selector from "./Selector";

export default class BoxSelector extends Selector{
    helper: THREE.Box3Helper;
    meshController: GeometryController;
    /**
     *
     * @param canvasController
     * @param geometryController
     */
    constructor(canvasController: CanvasController, geometryController: GeometryController) {
        super(canvasController, geometryController);
        let box = new THREE.Box3();
        box.setFromCenterAndSize(new THREE.Vector3(0, 0, 0), new THREE.Vector3(1, 1, 1));
        this.helper = new THREE.Box3Helper(box, new THREE.Color(0xabcdef));
        this.helper.visible = false;
        this.meshController.mesh.add(this.helper);
        this.surfaceSelectionListener = this.surfaceSelectionListener.bind(this);
    }
    surfaceSelectionListener(query: string, _: Spec, event: string) {
        let selectionSettings = this.meshController.material.uniforms.selectionBoxes.value;
        selectionSettings[this.selectionIndex * 4] = new Vector3(-2, 0, 0);
        let boxBoundsSpec = this.spec.findChild('box',true);
        if (event == 'v') {
            if (boxBoundsSpec&&boxBoundsSpec.subNodesCount >= 2) {//Need both center and size to be specified
                let center = boxBoundsSpec.children[0].compile();
                let size = boxBoundsSpec.children[1].compile();
                if (center == undefined || size == undefined || center.length < 3 || size.length < 3
                    || isNaN(center[0]) || isNaN(size[0]) || isNaN(center[1]) || isNaN(size[1])
                    || isNaN(center[2]) || isNaN(size[2]))
                    return;
                let meshController = this.meshController;
                let mesh = meshController.mesh;
                let centerVec = new Vector3(center[0]/mesh.scale.x, center[1]/mesh.scale.y, center[2]/mesh.scale.z);
                let sizeVec = new Vector3(Math.abs(size[0]/mesh.scale.x), Math.abs(size[1]/mesh.scale.y),Math.abs(size[2]/mesh.scale.z));
                this.helper.box.setFromCenterAndSize(centerVec,
                    sizeVec);
                this.helper.updateMatrixWorld();
                selectionSettings[this.selectionIndex * 4] = new Vector3((this.focused)?0:-2, 0, 0);
                selectionSettings[this.selectionIndex * 4 + 1] = centerVec;
                selectionSettings[this.selectionIndex * 4 + 2] = sizeVec;
                //@ts-ignore
                meshController.material.uniforms.selectionBoxes.needsUpdate = true;
            }
        }
    }
    setColor(r: number, g: number, b: number): void {
        super.setColor(r, g, b);
        // @ts-ignore
        this.helper.material.color.setRGB(r,g,b);
        this.meshController.selectorSettings[this.selectionIndex * 4 + 3] = new Vector3(r,g,b);
    }
    detach() {
        super.detach();
        this.meshController.mesh.remove(this.helper);
    }

    onFocusChanged(spec: Spec, focused: boolean): void {
        this.focused = focused;
        this.helper.visible = focused;
        this.meshController.selectorSettings[this.selectionIndex * 4] = new Vector3((focused)?0:-2, 0, 0);
    }
}