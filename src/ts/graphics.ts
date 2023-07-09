import * as THREE from 'three';
import {FileControl, GeometryJSONStruct, GFileControl} from "./fileControl";
import { OrbitControls } from './external/OrbitControls';
import {OrbitControlsGizmo} from './external/OrbitControlsGizmo.js';
import { GLTFLoader } from './external/GLTFLoader.js';
import {OBJLoader} from './external/OBJLoader.js';
import {TransformControls} from "./external/TransformControls.js";


import {
    AxesHelper, Box3,
    GridHelper, Material,
    Mesh,
    MeshBasicMaterial,
    MeshNormalMaterial,
    MeshPhongMaterial, ShaderMaterial, Vector2, Vector3,
    WebGLRenderer
} from "three";
import {UFile} from "./server";
import {UI} from "./main";
import {Spec} from "./spec";

const selectionMaterial = new MeshPhongMaterial({color: 0xffaa55, visible:true,
    emissive:0xffff00, emissiveIntensity:0.1, side: THREE.DoubleSide});
const selectionMaterial2 = new MeshPhongMaterial({color: 0xabcdef, visible:true,
    emissive:0x00ffff, emissiveIntensity:0.2, side: THREE.DoubleSide});
// const regularMaterial = new MeshPhongMaterial({side: THREE.DoubleSide});

class GeometryController{
    mesh: THREE.Mesh;
    //Number of selection conditions simultaneously
    //imposed on the geometry
    selectionCount = 0;
    /**
     * Material that the geometry is rendered with
     */
    material: ShaderMaterial;
    constructor(mesh: THREE.Mesh){
        this.mesh = mesh;
        mesh.matrixWorldAutoUpdate = true;
        let vectorArray = [];//Alternate between specification type size and position,
//type.x < 0 indicate the end of the array
//type.x = 0 implies box selection type
        let emptyVector = new THREE.Vector3(-1, -1, -1);
        for (let i = 0; i < 120; i++) {
            vectorArray.push(emptyVector);
        }
//Standard model of shader material
        this.material = new THREE.ShaderMaterial({
            side: THREE.DoubleSide,
            uniforms: {
                Ka: { value: new THREE.Vector3(0.9, 0.9, 0.9) },
                Kd0: { value: new THREE.Vector3(0.9, 0.9, 0.9) },
                Kd1: { value: new THREE.Vector3(0.9, 0.55, 0.21) },//When selected
                Ks: { value: new THREE.Vector3(0.8, 0.8, 0.8) },
                LightIntensity: { value: new THREE.Vector4(0.55, 0.55, 0.55, 1.0) },
                LightPosition: { value: new THREE.Vector4(0.0, 0, 10.0, 1.0) },
                Shininess: { value: 200.0 },
                selectionBoxes: {value: vectorArray},
                matrixWorld: { value: mesh.matrixWorld }
            },
            vertexShader: `
      varying vec3 Normal;
      varying vec3 Position;
      flat out vec3 orgPosition;
      uniform mat4 matrixWorld;

      void main() {
        Normal = normalize(normalMatrix * normal);
        Position = vec3(modelViewMatrix * vec4(position, 1.0));
        gl_Position =  projectionMatrix*modelViewMatrix*vec4(position, 1.0);
        orgPosition = vec3(matrixWorld*vec4(position, 1.0));
      }
    `,
            fragmentShader: `
      varying vec3 Normal;
      varying vec3 Position;
      flat in vec3 orgPosition;

      uniform vec3 Ka;
      uniform vec3 Kd0;
      uniform vec3 Kd1;
      uniform vec3 Ks;
      uniform vec4 LightPosition;
      uniform vec3 LightIntensity;
      uniform float Shininess;
      uniform vec3 selectionBoxes[60];

      vec3 phong() {
        vec3 n = normalize(Normal);
        vec3 s = normalize(vec3(LightPosition) - Position);
        vec3 v = normalize(vec3(-Position));
        vec3 r = reflect(-s, n);
        vec3 Kd = Kd0;
        vec3 emissive = vec3(0,0,0);
        
        //Check for box intersections
        for (int i = 0; i < 20; i++) {
         if (selectionBoxes[i*3].x == -1.0) {
           break; // Terminate the loop
         }
         switch(int(selectionBoxes[i*3].x)){
            case 0:
                vec3 center = selectionBoxes[i*3+1];
                vec3 size = selectionBoxes[i*3+2];
                vec3 ub = center+size/2.0;
                vec3 lb = center-size/2.0;
                if(ub.x>=orgPosition.x && ub.y>=orgPosition.y && ub.z>=orgPosition.z
                    && lb.x<=orgPosition.x&&lb.y<=orgPosition.y&&lb.z<=orgPosition.z){
                    Kd = Kd1;
                    emissive = vec3(0.1,0.1,0);
                }
                break;
            default:
                break;
         }
        }

        vec3 ambient = Ka;
        vec3 diffuse = Kd * abs(dot(s, n));
        vec3 specular = Ks * pow(abs(dot(r, v)), Shininess);

        return LightIntensity * (ambient + diffuse + specular)+emissive;
      }

      void main() {
        gl_FragColor = vec4(phong(), 1.0);
      }
    `
        });
    }
}
class CanvasController{
    canvas: Canvas;
    ui: UI;
    raySelector: RaySelector;
    meshToSpec: Map<Mesh, Spec>;
    //Active aspect of geometry being edited
    //One of translation, rotation, or scale
    activeEdit: string='translation';
    activeGeometry: Spec;
    activeMesh: Mesh;
    fileControl: GFileControl;
    meshList: {[id: string]:GeometryController[]}={};
    meshArray: THREE.Mesh[]=[];
    constructor(ui: UI, hostId: string, fileControl: GFileControl) {
        this.ui = ui;
        this.fileControl = fileControl;
        this.canvas = this.initiate(hostId);
        this.addRaySelector();
        this.raySelector.selectionCallback = (mesh)=>{
            this.activeMesh = mesh;
            this.canvas.transformControl.attach(mesh);
            let geoSpec = this.meshToSpec.get(mesh);
            geoSpec.selected=true;
            geoSpec.findChild(`/transformation`, true).editing = true;
            geoSpec.findChild(`/transformation/${this.activeEdit}`, true).editing = true;
            geoSpec.findChild(`/transformation`).secondarySelected = true;
            this.activeGeometry = geoSpec;
            this.ui.updateSpecPane();
        }
        this.raySelector.clearSelectionCallback = (mesh)=>{
            this.activeMesh = undefined;
            this.canvas.transformControl.detach();
            let geoSpec = this.meshToSpec.get(mesh);
            geoSpec.selected = false;
            this.activeGeometry.findChild(`/transformation`).editing = false;
            geoSpec.findChild(`/transformation/${this.activeEdit}`, true).editing = false;
            geoSpec.findChild(`/transformation`).secondarySelected = false;
            this.activeGeometry = undefined;
            this.ui.updateSpecPane();
        }
        this.configureTransformControl();
        this.meshToSpec = new Map();
    }
    initiate(hostId:string) {
        let camera: THREE.Camera, scene: THREE.Scene, renderer: WebGLRenderer;
        let htmlElement = document.getElementById(hostId);
        camera = new THREE.PerspectiveCamera(75, htmlElement.offsetWidth/ htmlElement.offsetHeight, 0.01, 10000);
        let dpp = 30;
        // let width = htmlElement.offsetWidth;
        // let height = htmlElement.offsetHeight;
        // camera = new THREE.OrthographicCamera(-width/2/dpp, width/2/dpp,
        //     height/2/dpp, -height/2/dpp, -2000, 2000);
        camera.position.y = -12;
        //camera.position.z = 10;
        camera.lookAt(0, 0, 0);
        camera.up.set(0, 0, 1);
        // THREE.Object3D.DEFAULT_UP = new THREE.Vector3(0,0,1);
        //camera.up.set(0, 1, 0);

        scene = new THREE.Scene();
        // const near = 7;
        // const far = 19;
        // const color = 'lightblue';
        // scene.fog = new THREE.Fog(color, near, far);

        renderer = new THREE.WebGLRenderer({
            antialias: true,
            alpha: true
        });
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.setClearColor( 0x000000, 0.0 );
        renderer.localClippingEnabled = true;

        let canvas = new Canvas(this, camera, scene, renderer, {perspective: true, dpp: dpp},
            htmlElement);

        canvas.animate();
        return canvas;
    }

    /**
     * Clears spec editing state from originally active edit,
     * sets current editing state of current active edit to true
     * @param activeEdit
     * @private
     */
    private switchActiveEdit(activeEdit: string){
        this.activeGeometry.findChild(`/transformation/${this.activeEdit}`, true).editing = false;
        this.activeEdit = activeEdit;
        this.activeGeometry.findChild(`/transformation/${activeEdit}`, true).editing = true;
        this.ui.updateSpecPane();
    }
    addRaySelector(){
        let htmlElement = this.canvas.renderer.domElement;
        this.raySelector = new RaySelector(this);
        let moved = false;
        let downListener = () => {
            moved = false
        };
        htmlElement.addEventListener('mousedown', downListener);
        let moveListener = (e:MouseEvent) => {
            moved = true;
            this.raySelector.onPointerMove(e,htmlElement);
        };
        htmlElement.addEventListener('mousemove', moveListener);
        let upListener = (e:MouseEvent) => {
            if (moved) {
                console.log('moved')
            } else {
                this.raySelector.select();
            }
        };
        htmlElement.addEventListener('mouseup', upListener);
    }
    configureTransformControl(){
        document.onkeydown = (e)=>{
            console.log(this.activeGeometry);
            if(this.activeGeometry==undefined)
                return;
            if(e.key == 't'){
                this.canvas.transformControl.setMode('translate');
                this.switchActiveEdit('translation');
            }
            if(e.key == 'r'){
                this.canvas.transformControl.setMode('rotate');
                this.switchActiveEdit('rotation');
            }
            if(e.key == 's'){
                this.canvas.transformControl.setMode('scale');
                this.switchActiveEdit('scale');
            }
        }
        this.canvas.transformControl.addEventListener('objectChange', (e)=>{
            let transformation = this.activeGeometry.findChild(`transformation/${this.activeEdit}`);
            transformation.type = 'list';
            if(transformation.subNodesCount==0){
                for(let i = 0; i<3; i++){
                    transformation.pushChild(new Spec(`${i}`, transformation, true));
                }
            }
            // To avoid double-updating the graphics
            this.pauseGeometryUpdate=true;
            switch(this.activeEdit){
                case 'translation':
                    let translations = transformation.children;
                    translations[0].setValue(this.activeMesh.position.x);
                    translations[1].setValue(this.activeMesh.position.y);
                    translations[2].setValue(this.activeMesh.position.z);
                    console.log(this.activeMesh.matrixWorld);
                    console.log(this.canvas.scene.matrixWorld);
                    console.log(this.activeMesh.modelViewMatrix);
                    break;
                case 'rotation':
                    let rotations = transformation.children;
                    if(rotations)
                    rotations[0].setValue(this.activeMesh.rotation.x);
                    rotations[1].setValue(this.activeMesh.rotation.y);
                    rotations[2].setValue(this.activeMesh.rotation.z);
                    break;
                case 'scale':
                    let scale = transformation.children;
                    scale[0].setValue(this.activeMesh.scale.x);
                    scale[1].setValue(this.activeMesh.scale.y);
                    scale[2].setValue(this.activeMesh.scale.z);
                    break;
            }
            this.pauseGeometryUpdate=false;
        });
    }
    discard(){
        this.canvas.renderer.dispose();
    }
    startAnimation(){
        this.canvas.paused = false;
    }
    stopAnimation(){
        this.canvas.paused = true;
    }

    loadFile(file:UFile){
        switch(file.extension){
            case 'glb':
            case 'gltf':
                let loader = new GLTFLoader();
                loader.load( file.accessURL(),  (gltf: any)=>{
                    console.log(gltf);
                    this.canvas.scene.add( gltf.scene );
                }, undefined, function ( error:Error ) {
                    console.error( error );
                } );
                break;
            case 'msh':
            case 'vtu':
            case 'obj':
                let objLoader = new OBJLoader();
                objLoader.load(file.accessURL(), (obj:any)=>{
                    console.log(obj);
                    obj.traverse( function ( child:Mesh ) {
                        child.material = new MeshNormalMaterial({side: THREE.DoubleSide});
                    } );
                    this.canvas.scene.add(obj);
                });
                break;
        }
    }

    /**
     * Load listeners on a per geometry basis
     */
    addJSONListeners(geometrySpec: Spec){
        const selection2Listener=(target: Spec, selected: boolean)=>{
            if(selected&&!target.selected){
                for(let controller of this.meshList[target.query]){
                    // previousMaterial = mesh.material;
                    controller.mesh.material = selectionMaterial2;
                }
                setTimeout( ()=>{
                    if(!target.selected){
                        for(let controller of this.meshList[target.query]){
                            controller.mesh.material = controller.material;
                        }
                    }
                }, 500);
            }else if(!selected&&!target.selected){
                for(let controller of this.meshList[target.query]){
                    controller.mesh.material = controller.material;
                }
            }
        }
        const selectionListener=(target: Spec, selected: boolean)=>{
            if(selected){
                for(let controller of this.meshList[target.query]){
                    // previousMaterial = mesh.material;
                    controller.mesh.material = selectionMaterial;
                }
            }else if(!selected&&!target.secondarySelected){
                for(let controller of this.meshList[target.query]){
                    controller.mesh.material = controller.material;
                }
            }
        }

        geometrySpec.subscribeSelectionService(selectionListener, true);
        geometrySpec.subscribeSelectionService(selection2Listener, false);

        let surfaceSelections = geometrySpec.matchChildren(...'/surface_selection'.split('/'));
        let geometryControllers = this.meshList[geometrySpec.query];
        for(let surfaceSelection of surfaceSelections){
            let boxSelectorSpecs = surfaceSelection.matchChildren(...'/*/box'.split('/'));
            console.log('box selector spec: ');
            console.log(boxSelectorSpecs);
            for(let boxSelectorSpec of boxSelectorSpecs){
                for(let geometryController of geometryControllers){
                    let boxSelector = new BoxSelector(this, geometryController.selectionCount++);
                    surfaceSelection.subscribeSelectionService(boxSelector.selectionListener, false);
                    boxSelectorSpec.subscribeChangeService(boxSelector.surfaceSelectionBoxListener)
                    (boxSelectorSpec.query,boxSelectorSpec,'v');
                    surfaceSelection.parent.subscribeSelectionService(boxSelector.parentSelectionListener, false);
                }
            }
        }

        const translationListener = (query:string, target:Spec)=>{
            let tr = this.ui.specEngine.compile(target);
            if(tr instanceof Array&&tr.length<3)
                return;
            let translation = <number[]>((tr instanceof Number)? [tr, tr, tr]: tr);
            this.meshList[geometrySpec.query].forEach( ( controller:GeometryController )=>{
                let child = controller.mesh;
                if(this.pauseGeometryUpdate||child instanceof THREE.Group){
                    return;
                }
                if(!isNaN((translation[0]))&&!isNaN(translation[1])&&!isNaN(translation[2]))
                    child.position.set(translation[0],translation[1],translation[2]);});

        }
        const scaleListener = (query:string, target:Spec)=>{
            let sc = this.ui.specEngine.compile(target);
            if(sc instanceof Array&&sc.length<3)
                return;
            let scale = <number[]>((sc instanceof Number)? [sc, sc, sc]: sc);
            this.meshList[geometrySpec.query].forEach( ( controller:GeometryController )=>{
                let child = controller.mesh;
                if(this.pauseGeometryUpdate||child instanceof THREE.Group){
                    return;
                }
                if(!isNaN((scale[0]))&&!isNaN(scale[1])&&!isNaN(scale[2]))
                    child.scale.set(scale[0],scale[1],scale[2]);
            });
        }
        const rotationListener = (query:string, target:Spec)=>{
            let rt = this.ui.specEngine.compile(target);
            if(rt instanceof Array&&rt.length<3)
                return;
            let rotation = <number[]> ((rt instanceof Number)? [rt, rt, rt]: rt);
            this.meshList[geometrySpec.query].forEach( ( controller:GeometryController )=>{
                let child = controller.mesh;
                if(this.pauseGeometryUpdate||child instanceof THREE.Group){
                    return;
                }
                if(!isNaN((rotation[0]))&&!isNaN(rotation[1])&&!isNaN(rotation[2]))
                    child.rotation.set(rotation[0],rotation[1],rotation[2]);});
        }
        //Here the parameter target will be the added children of transformation spec,
        //the listeners above are designed for each of the translation/rotation/scale updates
        let transformationChildListener = (query:string, target:Spec, event:string)=>{
            if(event=='ca'){
                let target = this.fileControl.specRoot.findChild(query);
                switch(target.name){
                    case 'translation':
                        target.subscribeChangeService(translationListener);
                        break;
                    case 'rotation':
                        target.subscribeChangeService(rotationListener);
                        break;
                    case 'scale':
                        target.subscribeChangeService(scaleListener);
                        break;
                    default: //Yet to be implemented: rotation_mode, dimension
                }
            }
        }
        let transformation = geometrySpec.findChild('/transformation');
        transformation.subscribeChangeService(transformationChildListener);
        if(transformation.children!=undefined){//Initialize existing listeners
            for(let key in transformation.children){
                let target = transformation.children[key];
                switch(key){
                    case 'translation':
                        target.subscribeChangeService
                        (translationListener)(target.query,target,undefined);
                        break;
                    case 'rotation':
                        target.subscribeChangeService
                        (rotationListener)(target.query,target,undefined);
                        break;
                    case 'scale':
                        target.subscribeChangeService
                        (scaleListener)(target.query,target,undefined);
                        break;
                    default: //Yet to be implemented: rotation_mode, dimension
                }
            }
        }
    }

    pauseGeometryUpdate = false;
    /**
     * @param geometry
     * @param index index of the geometry inside the parent spec
     */
    loadGeometry(geometry: GeometryJSONStruct, index: number){
        let extension = geometry.mesh.split('.').pop();
        let fileName = geometry.mesh.split('/').pop();
        let file = new UFile(`${this.ui.fs.rootURL}/${geometry.mesh}`,fileName, false);
        let specRoot = this.fileControl.specRoot.findChild(`/geometry/${index}`);
        switch (extension) {
            case 'msh':
            case 'vtu':
            case 'obj':
                let objLoader = new OBJLoader();
                objLoader.load(file.accessURL(), (obj:any)=>{
                    obj.traverse( ( child:Mesh)=>{
                        if(this.meshList[specRoot.query]==undefined)
                            this.meshList[specRoot.query] = [];
                        let controller = new GeometryController(child);
                        this.meshList[specRoot.query].push(controller);
                        if(child instanceof THREE.Group){
                            return;
                        }
                        child.geometry.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new Vector3(0,1,0), new Vector3(0,0,1)));
                        child.material = controller.material;
                        this.canvas.scene.add(child);
                        this.meshToSpec.set(child, specRoot);
                        controller.mesh = child;
                        this.meshArray.push(child);
                    } );
                    this.addJSONListeners(specRoot);
                })
                break;
        }
    }

    selectObject(mesh: THREE.Mesh, boundingBox: THREE.Box3Helper){
        // mesh.geometry.
    }

    setNewHost(element: HTMLElement) {
        this.canvas.setNewHost(element);
    }
}

class BoxSelector{
    canvas: Canvas;
    canvasController: CanvasController;
    ui: UI;
    helper: THREE.Box3Helper;
    selectionIndex = 0;
    surfaceSelectorEngaged = false;
    //Tests for secondary selection of parents
    parentSelectorEngaged = false;

    /**
     *
     * @param canvasController
     * @param selectionIndex specifies which selection this is controlling
     */
    constructor(canvasController: CanvasController,selectionIndex:number){
        this.canvasController = canvasController;
        this.canvas = canvasController.canvas;
        this.selectionIndex = selectionIndex;
        this.ui = this.canvasController.ui;
        let box = new THREE.Box3();
        box.setFromCenterAndSize( new THREE.Vector3( 0, 0, 0 ), new THREE.Vector3( 1, 1, 1 ) );
        this.helper = new THREE.Box3Helper( box, new THREE.Color(0xabcdef) );
        this.helper.visible = false;
        this.canvas.scene.add( this.helper );
        this.surfaceSelectionBoxListener=this.surfaceSelectionBoxListener.bind(this);
        this.selectionListener=this.selectionListener.bind(this);
        this.parentSelectionListener=this.parentSelectionListener.bind(this);
    }
    surfaceSelectionBoxListener(query:string, target: Spec, event: string){
        console.log(query);
        if(event=='v'){
            if(target.subNodesCount>=2){
                let center = this.ui.specEngine.compile(target.children[0]);
                let size = this.ui.specEngine.compile(target.children[1]);
                console.log(center);
                console.log(size);
                if(center==undefined||size==undefined||center.length<3||size.length<3
                    ||isNaN(center[0])||isNaN(size[0])||isNaN(center[1])||isNaN(size[1])
                    ||isNaN(center[2])||isNaN(size[2]))
                    return;
                let meshControllers = this.canvasController.meshList[target.parent.parent.parent.query];
                if(meshControllers!=undefined){
                    for(let meshController of meshControllers){
                        let centerVec = new Vector3(center[0],center[1],center[2]);
                        let sizeVec = new Vector3(size[0],size[1],size[2]);
                        this.helper.box.setFromCenterAndSize(centerVec,
                            sizeVec);
                        this.helper.updateMatrixWorld();
                        this.helper.visible = target.parent.parent.secondarySelected;
                        let selectionSettings = meshController.material.uniforms.selectionBoxes.value;
                        selectionSettings[this.selectionIndex*3] = new Vector3(0,0,0);
                        selectionSettings[this.selectionIndex*3+1]=centerVec;
                        selectionSettings[this.selectionIndex*3+2]=sizeVec;
                        //@ts-ignore
                        meshController.material.uniforms.selectionBoxes.needsUpdate = true;
                    }
                }
            }
        }
    }
    selectionListener(target: Spec, selected:boolean){
        this.surfaceSelectorEngaged = selected;
        this.helper.visible = this.surfaceSelectorEngaged&&(target.selected||target.secondarySelected);
        if(selected){
            for(let controller of this.canvasController.meshList[target.parent.query]){
                controller.mesh.material = controller.material;
            }
        }else{// Force style update callbacks
            target.parent.secondarySelected = target.parent.secondarySelected;
            target.parent.selected = target.parent.selected;
        }
    }
    parentSelectionListener(target: Spec, selected: boolean){
        this.parentSelectorEngaged = selected;
        this.helper.visible =  this.surfaceSelectorEngaged&&(target.selected||target.secondarySelected);
    }
}

class RaySelector{
    rayCaster = new THREE.Raycaster();
    camera: THREE.Camera;
    scene: THREE.Scene;
    controller: CanvasController;
    canvas: Canvas;
    intersected: THREE.Mesh;

    pointer = new Vector2();
    constructor(controller: CanvasController){
        this.controller = controller;
        this.canvas = controller.canvas;
        this.camera = controller.canvas.camera;
        this.scene = controller.canvas.scene;
        this.onPointerMove = this.onPointerMove.bind(this);
        this.select = this.select.bind(this);
    }
    onPointerMove( event:MouseEvent,element: HTMLElement) {
        let rect = element.getBoundingClientRect();
        let x = event.clientX - rect.left; //x position within the element.
        let y = event.clientY - rect.top;
        this.pointer.x = ( x / rect.width ) * 2 - 1;
        this.pointer.y = - ( y / rect.height ) * 2 + 1;
    }
    select(){
        this.rayCaster.setFromCamera( this.pointer, this.camera );
        const intersects = this.rayCaster.intersectObjects( this.controller.meshArray, false );
        if ( intersects.length > 0 ) {
            let selected = intersects[ 0 ].object;
            if ( this.intersected != selected
                    && selected instanceof THREE.Mesh) {
                if ( this.intersected && this.intersected instanceof THREE.Mesh) {
                    this.clearSelectionCallback(this.intersected);
                }
                this.intersected = selected;
                this.selectionCallback(selected);
            }
        } else {
            if ( this.intersected ){
                this.clearSelectionCallback(this.intersected);
            }
            this.intersected = undefined;
        }
    }
    selectionCallback(mesh: Mesh){

    }
    clearSelectionCallback(mesh: Mesh){

    }
}

/**
 * Canvas
 * Container of THREE elements for imperative manipulation of the canvas
 */
class Canvas {
    public camera: THREE.Camera;
    public scene: THREE.Scene;
    public renderer: THREE.WebGLRenderer;
    public htmlElement: HTMLElement;
    public controlsGizmo: OrbitControlsGizmo;
    public transformControl: TransformControls;
    public width: number;
    public height: number;
    public time: number = 0;
    public paused = false;
    public config: {
        perspective: boolean,
        dpp: number
    };
    public gridHelper: GridHelper[] = [];
    public axesHelper: AxesHelper;
    public canvasController: CanvasController;
    constructor(canvasController: CanvasController, camera: THREE.Camera, scene: THREE.Scene,
                renderer: THREE.WebGLRenderer, config: { perspective: boolean, dpp: number }, htmlElement: HTMLElement) {
        this.canvasController = canvasController;
        this.htmlElement = htmlElement;
        this.camera = camera;
        this.scene = scene;
        this.renderer = renderer;
        this.config = config;
        htmlElement.appendChild(renderer.domElement);
        window.addEventListener("resize", this.onResize.bind(this));

        let orbitControl = new OrbitControls(camera, renderer.domElement);
        this.controlsGizmo = new  OrbitControlsGizmo(orbitControl, { size:  100, padding:  8 });

        this.transformControl = new TransformControls(camera, renderer.domElement);
        this.transformControl.addEventListener( 'dragging-changed', function ( event ) {
            orbitControl.enabled = ! event.value;
        } );
        this.scene.add(this.transformControl);
        this.scene.background = new THREE.Color(0x333333);

        let controlEl = (<HTMLElement>this.controlsGizmo.domElement);
        controlEl.style.position='absolute';
        controlEl.style.right='7pt';
        controlEl.style.top='7pt';
        controlEl.style.borderStyle='solid';
        controlEl.style.borderRadius='20%';
        controlEl.style.boxShadow='5px 5px 5px 0px rgba(0,0,0,0.3)';
        controlEl.style.background='rgba(255,255,255,0.2)';
        htmlElement.appendChild(this.controlsGizmo.domElement);

        // new OrbitalControlUpdater(tr, canvas);
        let light1 = new THREE.DirectionalLight(0xffffff, 0.25);
        light1.position.set(0, 0, 5);
        camera.add(light1);
        let light2 = new THREE.DirectionalLight(0xffffff, 0.15);
        light2.position.set(0, 5, 5);
        camera.add(light2);
        let light3 = new THREE.DirectionalLight(0xffffff, 0.15);
        light3.position.set(0, -5, 5);
        camera.add(light3);
        let light4 = new THREE.AmbientLight(0xffffff, 0.5);
        light4.position.set(5, 0, 0);
        scene.add(light4);
        scene.add(camera);
        // let gridHelper = new THREE.GridHelper(12, 12);
        // gridHelper.rotateX(Math.PI / 2);
        // this.scene.add(gridHelper);
        // this.gridHelper.push(gridHelper);
        //
        // let gridHelper2 = new THREE.GridHelper(12, 12);
        // gridHelper2.rotateZ(Math.PI / 2);
        // this.scene.add(gridHelper2);
        // this.gridHelper.push(gridHelper2);
        //
        // let gridHelper3 = new THREE.GridHelper(12, 12);
        // this.scene.add(gridHelper3);
        // this.gridHelper.push(gridHelper3);
        //
        // let axesHelper = new THREE.AxesHelper(7);
        // this.scene.add(axesHelper);
        // this.axesHelper = axesHelper;

        this.onResize();
    }

    setNewHost(element: HTMLElement) {
        this.htmlElement.removeChild(this.renderer.domElement);
        this.htmlElement.removeChild(this.controlsGizmo.domElement);
        element.appendChild(this.renderer.domElement);
        element.appendChild(this.controlsGizmo.domElement);
        this.htmlElement = element;
        this.onResize();
    }

    animate() {
        this.renderer.setAnimationLoop(this.animation.bind(this));
    }

    animation(time: number) {
        if(!this.paused){
            this.time = time / 1000;
            this.renderer.render(this.scene, this.camera);
            let initial = true;
            for(let key in this.canvasController.meshList){
                for(let controller of this.canvasController.meshList[key]){
                    controller.material.uniforms.matrixWorld.value = controller.mesh.matrixWorld;
                    // @ts-ignore
                    controller.material.uniforms.matrixWorld.needsUpdate = true;
                }
            }
        }
    }

    onResize() {
        this.width = this.htmlElement.offsetWidth;
        this.height = this.htmlElement.offsetHeight;
        // $(this.htmlElement).outerWidth(this.width);
        // $(this.htmlElement).outerHeight(this.height);
        this.renderer.setSize(this.width, this.height);
        if (this.camera instanceof THREE.PerspectiveCamera) {
            this.camera.aspect = this.width / this.height;
            this.camera.updateProjectionMatrix();
        }
        if (this.camera instanceof THREE.OrthographicCamera) {
            this.camera.left = -this.width / 2 / this.config.dpp;
            this.camera.right = this.width / 2 / this.config.dpp;
            this.camera.bottom = -this.height / 2 / this.config.dpp;
            this.camera.top = this.height / 2 / this.config.dpp;
            this.camera.updateProjectionMatrix();
        }
    }
}

export{Canvas, CanvasController};