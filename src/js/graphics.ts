import * as BABYLON from 'babylonjs';
import 'babylonjs-loaders';
import { Engine, Mesh, Scene } from 'babylonjs';
import HemisphericLight = BABYLON.HemisphericLight;
import MeshBuilder = BABYLON.MeshBuilder;
import Vector3 = BABYLON.Vector3;
import ArcRotateCamera = BABYLON.ArcRotateCamera;
import {UFile} from "./server";
import UtilityLayerRenderer = BABYLON.UtilityLayerRenderer;
import {GeometricOperation} from "./fileControl";
import ParamPanel from "./ParamPanel";
import {AbstractMesh} from "babylonjs/Meshes/abstractMesh";
import OrientationCube from "./OrientationCube";
import {IconPanel} from "./IconTray";

//BABYLON has to render everything in the x-z-y coordinate system,
//so the easiest way is to exchange the y-z coordinates when
//setting transformations, such that the visual representations
//match the coordinate conventions of datasets
class App {
    scene: Scene;
    meshes:{[key: string]:BABYLON.AbstractMesh[]} = {};
    meshToKey = new Map();
    gizmoManager: BABYLON.GizmoManager;
    camera: ArcRotateCamera;
    dom: HTMLElement;
    json: {};
    revertOperation: ()=>void;
    redoOperation: ()=>void;
    //The mesh that is under active control
    activeMesh: BABYLON.AbstractMesh;
    activeMeshKey: string;
    paramPanel: ParamPanel;
    iconPanel: IconPanel
    canvas: HTMLCanvasElement;
    hl: BABYLON.HighlightLayer;
    oc: OrientationCube;
    constructor() {
        this.dom = document.createElement("div");
        this.dom.className = "canvasZone";
        // create the canvas html element and attach it to the webpage
        let canvas = <HTMLCanvasElement>document.createElement("canvas");
        canvas.className = "canvas";
        this.canvas = canvas;
        this.dom.append(canvas);
        canvas.style.width = "100%";
        canvas.style.height = "100%";
        this.paramPanel = new ParamPanel();
        this.dom.append(this.paramPanel.div);

        this.iconPanel = new IconPanel(this);
        this.dom.append(this.iconPanel.div);

        // initialize babylon scene and engine
        let engine = new Engine(canvas, true);
        let ob = new ResizeObserver(()=>{engine.resize()});
        ob.observe(canvas);

        this.scene = new Scene(engine);
        let scene = this.scene;
        //@ts-ignore
        scene.clearColor = new BABYLON.Color3(0.98, 0.98,0.98);
        let camera: ArcRotateCamera = new ArcRotateCamera("Camera", Math.PI*3 / 2, Math.PI / 2, 10, Vector3.Zero(), scene);
        this.camera = camera;
        camera.minZ = 0.0001;
        camera.attachControl(canvas, true);
        camera.wheelDeltaPercentage = 0.07;

        this.oc = new OrientationCube(new Scene(engine));
        this.camera.onProjectionMatrixChangedObservable.add((e,s)=>{
            this.oc.camera.alpha = camera.alpha;
            this.oc.camera.beta = camera.beta;
        });
        // this.oc.camera.attachControl(canvas, true);
        this.oc.camera.lowerRadiusLimit = 5;
        this.oc.camera.upperRadiusLimit = 5;
        this.oc.camera.viewport = new BABYLON.Viewport(0.75, 0.75, 0.3, 0.3);

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
                this.paramPanel.hideInfo();
            }
            if (e.ctrlKey && e.key === "z") {
                if(this.revertOperation!=undefined)
                    this.revertOperation();
            }
            if (e.ctrlKey && e.key === "y") {
                if(this.redoOperation!=undefined)
                    this.redoOperation();
            }
        }
        this.gizmoManager.attachableMeshes = [];
        this.gizmoManager.scaleGizmoEnabled=true;
        // this.gizmoManager.boundingBoxGizmoEnabled=true;
        this.gizmoManager.positionGizmoEnabled = true;
        this.gizmoManager.gizmos.scaleGizmo.sensitivity=6;
        this.gizmoManager.scaleGizmoEnabled= false;
        this.addHighlight();
        // run the main render loop
        engine.runRenderLoop(() => {
            this.scene.render();
            this.oc.scene.autoClear = false;
            this.oc.scene.render();
        });
    }

    addHighlight(){
        // Add the highlight layer.
        let hl = new BABYLON.HighlightLayer("h1", this.scene);
        hl.outerGlow = false;
        this.hl = hl;
        let scene = this.scene;
        let onPointerMove = function(e) {
            let result = scene.pick(scene.pointerX, scene.pointerY);
            if (result.hit) {
                /*if(pickedMesh != result.pickedMesh)
                    hl.removeMesh(pickedMesh);
                */
                let pickedMesh = result.pickedMesh;
                console.log(pickedMesh);
                hl.removeAllMeshes();
                if (result.pickedMesh instanceof Mesh) {
                    hl.addMesh(result.pickedMesh, BABYLON.Color3.FromInts(255, 150, 0), false);
                }
            }
        };
        // scene.registerBeforeRender(() => {
        //     hl.blurHorizontalSize = 1;
        //     hl.blurVerticalSize = 1;
        // });
        this.canvas.addEventListener("pointermove", onPointerMove, false);
    }
    async loadConvertObj(url: string){
        //Standard call: http://127.0.0.1:8081/mesh-convert/data%2Fsol.vtu/sol.obj
        let fileName = url.split('/').pop().split('\\').pop();
        console.log(fileName);
        let fileURL = url.replace("\\", "%2F")
            .replace("/", "%2F");
        let fileType = fileName.substring(fileName.lastIndexOf("."), fileName.length);

        const model = (fileType!='.glb')?await BABYLON.SceneLoader.ImportMeshAsync(
            '',
            "http://127.0.0.1:8081/mesh-convert/"+fileURL+"/",
            fileName.substring(0, fileName.lastIndexOf("."))+'.obj',
            this.scene,
        ):await BABYLON.SceneLoader.ImportMeshAsync(
            '',
            "http://127.0.0.1:8081/getFile/",
            fileName,
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
    async loadScene(dir: string, json: any, editCallback:(operation: GeometricOperation)=>void,
                    revertCallback:()=>void, redoCallback:()=>void) {
        this.json = json;
        let geometries = json['geometry'];
        console.log(geometries);
        for (let key in geometries) {
            let geometry = geometries[key];
            let meshes = await this.loadConvertObj(geometry['mesh']);
            this.addMeshes(key, meshes, geometry);
        }
        this.gizmoManager.positionGizmoEnabled = true;
        //On selecting mesh
        this.gizmoManager.onAttachedToMeshObservable.add((mesh)=>{
            this.activeMesh = mesh;
            this.activeMeshKey = this.meshToKey.get(mesh);
            this.paramPanel.displayInfo(this.activeMeshKey, json);
            //Exchange y,z axis of the gizmos
            this.gizmoManager.gizmos.positionGizmo.yGizmo.customRotationQuaternion
                =new BABYLON.Quaternion(0, 1, 0, 0);
            this.gizmoManager.gizmos.positionGizmo.zGizmo.customRotationQuaternion
                =new BABYLON.Quaternion(0, -1, 0, 0);
        });
        this.gizmoManager.gizmos.scaleGizmo.onDragEndObservable.add(()=>{
            let geometry = this.json['geometry'][this.activeMeshKey];
            let scaling = this.activeMesh.scaling;

            let operation = new GeometricOperation(this.activeMeshKey);
            operation.operation = 'scale';
            let orgScale = geometry.transformation.scale;
            orgScale = (orgScale instanceof Array)?orgScale:[orgScale, orgScale, orgScale];
            operation.parameters = [scaling.x-orgScale[0], scaling.z-orgScale[1], scaling.y-orgScale[2]];

            geometry.transformation.scale = [scaling.x,scaling.z, scaling.y];
            editCallback(operation);
        })
        this.gizmoManager.gizmos.positionGizmo.onDragEndObservable.add(()=>{
            let geometry = this.json['geometry'][this.activeMeshKey];
            let position = this.activeMesh.position;

            let operation = new GeometricOperation(this.activeMeshKey);
            operation.operation = 'position';
            let orgPos = geometry.transformation.translation;
            orgPos = (orgPos instanceof Array)?orgPos:[orgPos, orgPos, orgPos];
            operation.parameters = [position.x-orgPos[0], position.z-orgPos[1], position.y-orgPos[2]];

            geometry.transformation.translation = [position.x,position.z, position.y];
            editCallback(operation);
        })
        this.revertOperation = revertCallback;
        this.redoOperation = redoCallback;
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
                mesh.position.set(translation[0], translation[2], translation[1]);
            if(scale!=undefined)
                mesh.scaling.set(scale[0], scale[2], scale[1]);
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

    async insertJSONGeometry(file: UFile, callback:(json: {})=>void) {
        let geometry = {
            "mesh": file.url.replace("\\", "/"),
            "transformation": {
                "translation": 0,
                "scale": 1
            }
        }
        this.json["geometry"].push(geometry);
        let meshes = await this.loadConvertObj(geometry['mesh']);
        console.log(meshes);
        let key = this.json["geometry"].length-1;
        this.addMeshes(key.toString(), meshes, geometry);
        callback(this.json);
    }

    addMeshes(key: string, meshes: AbstractMesh[], geometry){
        this.meshes[key] = meshes;
        let gizmoManager = this.gizmoManager;
        gizmoManager.attachableMeshes.push(...meshes);
        meshes.map((mesh) => {
            this.meshToKey.set(mesh, key);
            console.log(mesh);
        });
        this.loadTransformation(geometry, meshes);
    }
}
export {App};