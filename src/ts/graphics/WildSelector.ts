import Selector from "./Selector";
import {Spec} from "../spec";
import {UFile} from "../server";
import THREE, {BufferGeometry, Camera, Matrix3, Mesh, Raycaster, Vector2, Vector3} from "three";
import {CanvasController} from "../graphics";
import GeometryController from "./GeometryController";
import {spec} from "node:test/reporters";

export default class WildSelector extends Selector{
    editedFile: UFile;
    /**
     * vec(u,v, spherical theta),
     * vec(normal on surface),
     * vec(color)
     * theta (in radian)
     */
    paths: Matrix3[][] = [];
    mesh: Mesh;

    constructor(canvasController: CanvasController, geometryController: GeometryController) {
        super(canvasController, geometryController);
        this.surfaceSelectionListener = this.surfaceSelectionListener.bind(this);
        this.mesh = geometryController.mesh;
    }
    attach(spec: Spec, effectiveDepth: number, layer: string, reference: string) {
        super.attach(spec, effectiveDepth, layer, reference);
        spec.setDrawing = this.setDrawing.bind(this);
    }

    onFocusChanged(spec: Spec, focused: boolean): void {
    }
    surfaceSelectionListener(query: string, target: Spec, event: string): void {
    }
    setDrawing(drawing:boolean){
        if(drawing)
            this.subscribeDraw();
        else
            this.unsubscribeDraw();
    }
    subscribeDraw(){
        this.canvasController.bvhRaycaster.attach(this.mesh,this.drawPath.bind(this));
    }
    unsubscribeDraw(){
        this.canvasController.bvhRaycaster.detach(this.mesh);
    }
    drawPath(u:number,v:number, normal:Vector3,faceIndex:number){

    }
    clearPaths(){
        this.paths.length = 0;
    }

    revertPath(){
        this.paths.pop();
    }
}

export class BVHRaycaster{
    mesh: Mesh;
    raycaster = new Raycaster();
    camera: Camera;
    private callback: (u:number,v:number, normal:Vector3,faceIndex:number)=>void;
    constructor(camera:Camera) {
        this.camera = camera;
    }
    attach(mesh: Mesh, callback:
        (u:number,v:number, normal:Vector3, faceIndex:number)=>void){
        this.mesh = mesh;
        let geometry = mesh.geometry;
        geometry.computeBoundsTree();
        this.callback = callback;
    }
    detach(mesh:Mesh){
        if(mesh==this.mesh)
            this.mesh = undefined;
    }
    cast(pointer: {x:number,y:number}){
        if(this.mesh==undefined)
            return;
        this.raycaster.setFromCamera(pointer, this.camera);
        const intersections = this.raycaster.intersectObject(this.mesh);
        if(intersections.length!=0){
            const intersection = intersections[0];
            const uv = intersection.uv;
            const faceIndex = intersection.faceIndex;
            const normal = intersection.face.normal;
            this.callback(uv.x,uv.y,normal,faceIndex)
        }
    }
}