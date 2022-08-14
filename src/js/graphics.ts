import * as BABYLON from 'babylonjs';
import 'babylonjs-loaders';
import { Engine, Mesh, Scene } from 'babylonjs';
import HemisphericLight = BABYLON.HemisphericLight;
import MeshBuilder = BABYLON.MeshBuilder;
import Vector3 = BABYLON.Vector3;
import ArcRotateCamera = BABYLON.ArcRotateCamera;
import {UFile} from "./server";
import UtilityLayerRenderer = BABYLON.UtilityLayerRenderer;

class App {
    scene: Scene;
    meshes:{[key: string]:BABYLON.AbstractMesh[]} = {};
    meshToKey = new Map();
    gizmoManager: BABYLON.GizmoManager;
    camera: ArcRotateCamera;
    dom: HTMLElement;
    json: {};
    //The mesh that is under active control
    activeMesh: BABYLON.AbstractMesh;
    activeMeshKey: string;
    constructor() {
        this.dom = document.createElement("div");
        this.dom.className = "canvasZone";
        // create the canvas html element and attach it to the webpage
        let canvas = <HTMLCanvasElement>document.createElement("canvas");
        canvas.className = "canvas";
        this.dom.append(canvas);
        canvas.style.width = "100%";
        canvas.style.height = "100%";

        // initialize babylon scene and engine
        let engine = new Engine(canvas, true);
        let ob = new ResizeObserver(()=>{engine.resize()});
        ob.observe(canvas);

        this.scene = new Scene(engine);
        let scene = this.scene;
        //@ts-ignore
        scene.clearColor = new BABYLON.Color3(0.98, 0.98,0.98);
        let camera: ArcRotateCamera = new ArcRotateCamera("Camera", Math.PI / 2, Math.PI / 2, 10, Vector3.Zero(), scene);
        this.camera = camera;
        camera.minZ = 0.0001;
        camera.attachControl(canvas, true);
        camera.wheelDeltaPercentage = 0.07;
        // camera.heightOffset
        let light1 = new BABYLON.HemisphericLight("light1", new BABYLON.Vector3(0, 1, 0.5), scene);
        light1.diffuse = new BABYLON.Color3(0.8, 0.8, 0.8);
        // hide/show the Inspector
        window.addEventListener("keydown", (ev) => {
            // Shift+Ctrl+Alt+I
            if (ev.shiftKey && ev.ctrlKey && ev.altKey && ev.keyCode === 73) {
                if (scene.debugLayer.isVisible()) {
                    scene.debugLayer.hide();
                } else {
                    scene.debugLayer.show({
                        embedMode: true
                    });
                }
            }
        });
        this.updateCameraView = this.updateCameraView.bind(this);

        this.gizmoManager = new BABYLON.GizmoManager(this.scene, 1.5, new UtilityLayerRenderer(this.scene));

        document.onkeydown = (e)=>{
            if(e.key == 't'){
                this.gizmoManager.positionGizmoEnabled = !this.gizmoManager.positionGizmoEnabled;
                this.gizmoManager.scaleGizmoEnabled = !this.gizmoManager.scaleGizmoEnabled;
            }
            if(e.key=='Escape'){
                this.gizmoManager.attachToMesh(undefined);
            }
        }
        this.gizmoManager.attachableMeshes = [];
        this.gizmoManager.scaleGizmoEnabled=true;
        // this.gizmoManager.boundingBoxGizmoEnabled=true;
        this.gizmoManager.positionGizmoEnabled = true;
        this.gizmoManager.gizmos.scaleGizmo.sensitivity=6;
        this.gizmoManager.scaleGizmoEnabled= false;
        // run the main render loop
        engine.runRenderLoop(() => {
            this.scene.render();
        });
    }
    async loadConvertObj(url: string){
        //Standard call: http://127.0.0.1:8081/mesh-convert/data%2Fsol.vtu/sol.obj
        let fileName = url.split('/').pop().split('\\').pop();
        console.log(fileName);
        let fileURL = url.replace("\\", "%2F")
            .replace("/", "%2F");
        const model = await BABYLON.SceneLoader.ImportMeshAsync(
            '',
            "http://127.0.0.1:8081/mesh-convert/"+fileURL+"/",
            fileName.substring(0, fileName.lastIndexOf("."))+'.obj',
            this.scene,
        );
        console.log(model);
        model.meshes.map((mesh)=>{
            (mesh as Mesh).convertToFlatShadedMesh();
            // let meshMin = mesh.getBoundingInfo().boundingBox.minimum;
            // let meshMax = mesh.getBoundingInfo().boundingBox.maximum;
            // //@ts-ignore
            // mesh.enableEdgesRendering((meshMax-meshMin)*0.01);
        });
        this.updateCameraView();
        return model.meshes;
    }
    updateCameraView(){
        let minmax = this.scene.getWorldExtends();
        this.camera.radius = minmax.max.subtract(minmax.min).length();
        this.camera.minZ = this.camera.radius*0.001;
    }
    clearScene(){
        while(this.scene.meshes.length!=0){
            this.scene.meshes.pop().dispose();
        }
    }
    async loadMesh(url: string){
        this.clearScene();
        let fileName = url.replace("\\", "%2F")
            .replace("/", "%2F");
        const model = await BABYLON.SceneLoader.ImportMeshAsync(
            '',
            "http://127.0.0.1:8081/getFile/",
            fileName,
            this.scene,
        );
        console.log(model);
        model.meshes.map((mesh)=>{
            (mesh as Mesh).convertToFlatShadedMesh();
        })
        this.updateCameraView();
        return model.meshes;
    }
    loadObject(url: string){
        let fileName = url.replace("\\", "%2F")
            .replace("/", "%2F");
        this.clearScene();
        BABYLON.SceneLoader.Append("http://127.0.0.1:8081/getFile/", fileName, this.scene,
            (scene)=>{
                this.updateCameraView();
        });
    }
    async loadScene(dir: string, json: any, jsonUpdateCallback:()=>void) {
        this.json = json;
        let geometries = json['geometry'];
        console.log(geometries);
        for (let key in geometries) {
            let geometry = geometries[key];
            let meshes = await this.loadConvertObj(geometry['mesh']);
            this.meshes[key] = meshes;
            let gizmoManager = this.gizmoManager;
            // Restrict gizmos to only spheres
            gizmoManager.attachableMeshes.push(...meshes);
            this.gizmoManager.scaleRatio=1;
            meshes.map((mesh)=>{
                this.meshToKey.set(mesh, key);
            });
            this.loadTransformation(geometry, meshes);
        }
        this.gizmoManager.positionGizmoEnabled = true;
        this.gizmoManager.onAttachedToMeshObservable.add((mesh)=>{
            this.activeMesh = mesh;
            this.activeMeshKey = this.meshToKey.get(mesh);
        });
        this.gizmoManager.gizmos.scaleGizmo.onDragEndObservable.add(()=>{
            let geometry = this.json['geometry'][this.activeMeshKey];
            let scaling = this.activeMesh.scaling;
            geometry.transformation.scale = [scaling.x,scaling.y, scaling.z];
            jsonUpdateCallback();
        })
        this.gizmoManager.gizmos.positionGizmo.onDragEndObservable.add(()=>{
            let geometry = this.json['geometry'][this.activeMeshKey];
            let position = this.activeMesh.position;
            geometry.transformation.translation = [position.x,position.y, position.z];
            jsonUpdateCallback();
        })
    }
    loadTransformation(geometry:{}, meshes: BABYLON.AbstractMesh[]){
        if(geometry==undefined){
            return;
        }
        let transformation = geometry['transformation'];
        let translation = transformation['translation'];
        let scale = transformation['scale'];
        if(translation!=undefined&&!(translation instanceof Array)){
            translation = [translation, translation, translation];
        }
        if(scale!=undefined&&!(scale instanceof Array)){
            scale = [scale, scale, scale];
        }
        for (let mesh of meshes) {
            if(translation!=undefined)
                mesh.position.set(translation[0], translation[1], translation[2]);
            if(scale!=undefined)
                mesh.scaling.set(scale[0], scale[1], scale[2]);
        }
    }

    updateJSON(updatedJSON: {}){
        this.json = updatedJSON;
        let geometries = updatedJSON['geometry'];
        for (let key in geometries) {
            let geometry = geometries[key];
            let meshes = this.meshes[key];
            this.loadTransformation(geometry, meshes);
        }
    }
}
export {App};