import {UI} from "../main";
import {Spec, SpecEngine} from "../spec";
import THREE, {Mesh, MeshPhongMaterial, Vector2, Vector3} from "three";
import {Canvas, CanvasController} from "../graphics";
import GeometryController from "./GeometryController";
import Selector from "./Selector";
import CrossReference from "./CrossReference";


const selectionMaterial = new MeshPhongMaterial({color: 0xabcdef, visible:true,
    side: THREE.DoubleSide, opacity:0.2, transparent:true});

const vselectionMaterial = new MeshPhongMaterial({color: 0xfbda6f, visible:true,
    side: THREE.DoubleSide, opacity:0.2, transparent:true});

export default class PlaneSelector extends Selector{
    canvas: Canvas;
    planeBoundary: THREE.PlaneGeometry;
    helper: THREE.Mesh;
    surfaceSelectorEngaged = false;
    meshController: GeometryController;

    /**
     *
     * @param canvasController
     * @param geometryController
     */
    constructor(canvasController: CanvasController, geometryController: GeometryController) {
        super(canvasController,geometryController);
        this.planeBoundary = new THREE.PlaneGeometry(5,5,1,1)
        this.helper = new THREE.Mesh(this.planeBoundary, selectionMaterial);
        this.helper.visible = false;
        this.helper.matrixAutoUpdate = false;
        this.meshController.mesh.add(this.helper);
        this.surfaceSelectionListener = this.surfaceSelectionListener.bind(this);
    }

    updateSelector(){
        this.surfaceSelectionListener('',this.spec,'v');
    }

    surfaceSelectionListener(query: string, target: Spec, event: string) {
        if (event == 'v') {
            let selectorSettings = this.meshController.selectorSettings;
            selectorSettings[this.selectionIndex * 4] = new Vector3(-2, 0, 0);
            this.helper.visible = false;
            if (target.subNodesCount >= 2) {//Need both center and size to be specified
                let point:number[] = target.children['point'].compile();
                let normal:number[] = target.children['normal'].compile();
                if (point == undefined || normal == undefined || point.length < 3 || normal.length < 3
                    || isNaN(point[0]) || isNaN(normal[0]) || isNaN(point[1]) || isNaN(normal[1])
                    || isNaN(point[2]) || isNaN(normal[2]))
                    return;
                let meshController = this.meshController;
                let mesh = meshController.mesh;
                let p = new Vector3(point[0]/mesh.scale.x, point[1]/mesh.scale.y, point[2]/mesh.scale.z);
                let z = new Vector3(normal[0], normal[1],normal[2]).normalize();
                let x = new Vector3(normal[1],-normal[0],0);
                x = (x.length()==0)?new Vector3(1,0,0):x.normalize();
                let y = new Vector3().crossVectors(z,x);
                let sx = mesh.scale.x, sy = mesh.scale.y, sz = mesh.scale.z;
                this.helper.matrix.set( x.x/sx, y.x/sx, z.x/sx, p.x,
                                        x.y/sy, y.y/sy, z.y/sy, p.y,
                                        x.z/sz, y.z/sz, z.z/sz, p.z,
                                        0,0,0,1);
                this.helper.updateMatrixWorld();
                selectorSettings[this.selectionIndex * 4] = new Vector3((this.focused)?2:-2, 0, 0);
                selectorSettings[this.selectionIndex * 4 + 1] = p;
                z.multiply(meshController.mesh.scale);
                selectorSettings[this.selectionIndex * 4 + 2] = z;
                //@ts-ignore
                meshController.material.uniforms.selectionBoxes.needsUpdate = true;
            }
        }
    }

    detach() {
        super.detach();
        this.meshController.mesh.remove(this.helper);
    }

    onFocusChanged(spec: Spec, focused: boolean): void {
        this.focused = focused;
        this.helper.visible = this.focused;
        this.meshController.selectorSettings[this.selectionIndex * 4] = new Vector3((this.focused)?2:-2, 0, 0);
    }
}