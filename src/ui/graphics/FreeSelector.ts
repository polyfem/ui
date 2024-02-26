import Selector from "./Selector";
import {Spec} from "../spec";
import {UFile, UFileSystem} from "../server";
import {BufferAttribute, BufferGeometry, Camera, Matrix3, Mesh, Raycaster, Vector2, Vector3} from "three";
import * as THREE from "three";
import {CanvasController} from "../graphics";
import GeometryController from "./GeometryController";

export default class FreeSelector extends Selector{
    editedFile: UFile;
    mesh: Mesh;
    phi= Math.PI/24;
    startingIndex=0;
    vertexColors: BufferAttribute;
    normals: BufferAttribute;
    fs: UFileSystem;
    /**
     * Masks of individual colors to be applied to each vertex
     */
    selfVertexColors:Float32Array;
    /**
     * Faces at which the wild selector selects,
     * first three entries indicate the vertices,
     * last entry indicate the id of the selection;
     * for computing color overlays in the future
     */
    selectedFaces: [number,number,number,number][] = [];
    drawing = false;

    /**
     * 
     * @param canvasController
     * @param geometryController
     */
    constructor(canvasController: CanvasController, geometryController: GeometryController) {
        super(canvasController, geometryController);
        this.surfaceSelectionListener = this.surfaceSelectionListener.bind(this);
        this.mesh = geometryController.mesh;
        this.mesh.geometry.computeVertexNormals();
        this.normals = <BufferAttribute>geometryController.mesh.geometry.getAttribute('normal');
        this.vertexColors = geometryController.vertexMasks;
        this.selfVertexColors = new Float32Array(this.vertexColors.count);
        // Don't block remaining selection shaders:
        geometryController.selectorSettings[this.selectionIndex * 4] = new Vector3(-2, 0, 0);
        this.fs = this.canvasController.ui.fs;

    }
    attach(spec: Spec, effectiveDepth: number, layer: string, reference: string) {
        super.attach(spec, effectiveDepth, layer, reference);
        spec.freeSelector = this;
        spec.drawable = true;
        spec.isFile = true;
        if(spec.value!=undefined){
            let file = this.fs.getFile(this.fs.fileRoot,spec.value,true);
            this.editedFile = file;
            console.log(file);
        }
    }

    onFocusChanged(spec: Spec, focused: boolean): void {
        this.meshController.uniforms.showPath.value = focused;
        //@ts-ignore
        this.meshController.uniforms.showPath.needsUpdate = true;
    }
    assignMasks(originNormal:Vector3,originLocation:Vector3){
        let indices = this.mesh.geometry.getIndex();
        let veca = new Vector3(), vecb = new Vector3(), vecc = new Vector3();
        for(let i = 0; i<indices.count/3; i++){
            let a = indices.array[i*3];
            let b = indices.array[i*3+1];
            let c = indices.array[i*3+2];
            this.mesh.getVertexPosition(a, veca);
            this.mesh.getVertexPosition(b, vecb);
            this.mesh.getVertexPosition(c, vecc);
            let normal = veca.sub(vecb).cross(vecb.sub(vecc)).normalize();
            if(normal.dot(originNormal)>=Math.cos(this.phi)){
            // if(veca.sub(originLocation).length()<this.phi // Use distance selection, for now.
            //     &&vecb.sub(originLocation).length()<this.phi&&vecc.sub(originLocation).length()<this.phi){
                //Assign color to all corresponding vertices
                this.vertexColors.setXYZ(a,...this.color);
                this.vertexColors.setXYZ(b,...this.color);
                this.vertexColors.setXYZ(c,...this.color);
                //Assign color to all local vertices
                this.assignColors(a,this.selfVertexColors);
                this.assignColors(b,this.selfVertexColors);
                this.assignColors(c,this.selfVertexColors);
                this.selectedFaces.push([Number(this.rid),a,b,c]);
            }
        }
        this.vertexColors.needsUpdate = true;
    }

    assignColors(index:number, bufferedArray:Float32Array){
        bufferedArray[index*3] = this.color[0];
        bufferedArray[index*3+1] = this.color[1];
        bufferedArray[index*3+2] = this.color[2];
    }
    repaint(){
        for(let i = 0; i<this.vertexColors.count/3; i++){
            this.vertexColors.setXYZ(i,-1,-1,-1);
        }
        for(let i = 0; i<this.selectedFaces.length; i++){
            let [id, a,b,c] = this.selectedFaces[i];
            this.vertexColors.setXYZ(a,...this.color);
            this.vertexColors.setXYZ(b,...this.color);
            this.vertexColors.setXYZ(c,...this.color);
        }
        this.vertexColors.needsUpdate = true;
    }
    surfaceSelectionListener(query: string, target: Spec, event: string): void {
        if(event=='v'){
            let file = this.fs.getFile(this.fs.fileRoot,target.value,true);
            this.openFile(file);
        }
    }
    setDrawing(drawing:boolean){
        if(drawing)
            this.subscribeDraw();
        else
            this.unsubscribeDraw();
        if(drawing)
            this.fileControl.drawService = this;
        else
            this.fileControl.drawService = undefined;
        this.drawing = drawing;
        this.fileControl.setDrawPlatte(drawing);
        this.fileControl.setRid(this.rid);
    }
    subscribeDraw(){
        console.log("attaching element");
        this.canvasController.bvhRaycaster.attach(this.mesh,
            this.drawPath.bind(this),this.pathStart.bind(this),this.pathEnd.bind(this));
    }
    unsubscribeDraw(){
        this.canvasController.bvhRaycaster.detach(this.mesh);
    }
    openFile(file:UFile){
        if(file==undefined)
            return;
        this.editedFile = file;
        this.selectedFaces = [];
        file.syncRead((data)=>{
           let lines = data.split('\n');
           for(let line of lines){
               this.selectedFaces.push(<[number,number,number,number]>
                   line.split(',').map(value => Number(value)))
           }
        });
        this.repaint();
    }
    pathTimestamp = 0;
    pathStart(){

    }
    pathEnd(){
        this.saveSelections();
    }
    onRidChanged(oId: string, nId: string) {
        super.onRidChanged(oId, nId);
        this.rid = nId;
    }

    /**
     * Use a timer to determine end of path
     * @param point
     * @param normal
     * @param faceIndex
     */
    drawPath(point:Vector3, normal:Vector3,faceIndex:number){
        this.assignMasks(normal,point);
    }
    saveSelections(){
        let total = '';
        for(let selectedFace of this.selectedFaces){
            total+=selectedFace+'\n';
        }
        this.editedFile?.saveFile(total);
    }
    setColor(r: number, g: number, b: number) {
        super.setColor(r, g, b);
        this.meshController.uniforms.pathColor.value = new Vector3(...this.color);
        this.repaint();
    }
}

export class BVHRaycaster{
    mesh: Mesh;
    raycaster = new Raycaster();
    camera: Camera;
    private callback: (point:Vector3, normal:Vector3,faceIndex:number)=>void;
    pathStart=()=>{};
    pathEnd=()=>{};
    constructor(camera:Camera) {
        this.camera = camera;
    }
    attach(mesh: Mesh, callback:
        (point:Vector3, normal:Vector3, faceIndex:number)=>void,
           pathStart:()=>void,pathEnd:()=>void){
        this.mesh = mesh;
        console.log(this.mesh);
        mesh.children.forEach((child) => {
            child.raycast = function () {}; // Override the raycast method to do nothing
        });
        let geometry = mesh.geometry;
        geometry.computeBoundsTree();
        this.callback = callback;
        this.pathStart = pathStart;
        this.pathEnd = pathEnd;
    }
    detach(mesh:Mesh){
        if(mesh==this.mesh)
            this.mesh = undefined;
    }
    test(pointer: {x:number,y:number}){
        if(this.mesh==undefined)
            return false;
        this.raycaster.setFromCamera(pointer, this.camera);
        const intersections = this.raycaster.intersectObject(this.mesh);
        return intersections.length!=0;
    }
    cast(pointer: {x:number,y:number}){
        if(this.mesh==undefined)
            return;
        this.raycaster.setFromCamera(pointer, this.camera);
        const intersections = this.raycaster.intersectObject(this.mesh);
        if(intersections.length!=0){
            const intersection = intersections[0];
            console.log(intersection);
            const point = intersection.point;
            const faceIndex = intersection.faceIndex;
            const normal = intersection.face.normal;
            this.callback(point,normal,faceIndex);
            return true;
        }
        return false;
    }
}