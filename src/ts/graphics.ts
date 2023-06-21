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
    MeshPhongMaterial, Vector2,
    WebGLRenderer
} from "three";
import {UFile} from "./server";
import {UI} from "./main";
import {Spec} from "./spec";

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
    meshList: {[id: string]:THREE.Mesh[]}={};
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
            console.log(this.activeGeometry);
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
        camera.position.z = 12;
        //camera.position.z = 10;
        camera.lookAt(0, 0, 0);
        // camera.up.set(0, 0, 1)
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

        let canvas = new Canvas(camera, scene, renderer, {perspective: true, dpp: dpp},
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
        this.raySelector = new RaySelector(this.canvas);
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

    addJSONListeners(){

        const selectionMaterial = new MeshPhongMaterial({color: 0xffaa55, visible:true,
            emissive:0xffff00, emissiveIntensity:0.1, side: THREE.DoubleSide});
        const selectionMaterial2 = new MeshPhongMaterial({color: 0xabcdef, visible:true,
            emissive:0x00ffff, emissiveIntensity:0.2, side: THREE.DoubleSide});
        const regularMaterial = new MeshPhongMaterial({side: THREE.DoubleSide});
        const selection2Listener=(target: Spec, selected: boolean)=>{
            if(selected&&!target.selected){
                for(let mesh of this.meshList[target.query]){
                    // previousMaterial = mesh.material;
                    mesh.material = selectionMaterial2;
                }
            }else if(!selected&&!target.selected){
                for(let mesh of this.meshList[target.query]){
                    mesh.material = regularMaterial;
                }
            }
        }
        const selectionListener=(target: Spec, selected: boolean)=>{
            if(selected){
                for(let mesh of this.meshList[target.query]){
                    // previousMaterial = mesh.material;
                    mesh.material = selectionMaterial;
                }
            }else if(!selected&&!target.secondarySelected){
                for(let mesh of this.meshList[target.query]){
                    mesh.material = regularMaterial;
                }
            }
        }
        let geometriesSpec = this.fileControl.specRoot.findChild('/geometry');
        for(let key in geometriesSpec.children){
            let geometry = geometriesSpec.children[key];
            geometry.subscribeSelectionService(selectionListener, true);
            geometry.subscribeSelectionService(selection2Listener, false);
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
                    this.meshList[specRoot.query]=[];
                    obj.traverse( ( child:Mesh )=>{
                        if(child instanceof THREE.Group){
                            return;
                        }
                        this.canvas.scene.add(child);
                        this.meshToSpec.set(child, specRoot);
                        this.meshList[specRoot.query].push(child);
                    } );

                    let translationListener = (query:string, target:Spec)=>{
                        let tr = this.ui.specEngine.compile(target);
                        let translation = <number[]>((tr instanceof Number)? [tr, tr, tr]: tr);
                        this.meshList[specRoot.query].forEach( ( child:Mesh )=>{
                            if(this.pauseGeometryUpdate||child instanceof THREE.Group){
                                return;
                            }
                            if(!isNaN((translation[0]))&&!isNaN(translation[1])&&!isNaN(translation[2]))
                                child.position.set(translation[0],translation[2],-translation[1]);});

                    }
                    let scaleListener = (query:string, target:Spec)=>{
                        let sc = this.ui.specEngine.compile(target);
                        if(sc instanceof Array&&sc.length<3)
                            return;
                        let scale = <number[]>((sc instanceof Number)? [sc, sc, sc]: sc);
                        this.meshList[specRoot.query].forEach( ( child:Mesh )=>{
                            console.log(child);
                            if(this.pauseGeometryUpdate||child instanceof THREE.Group){
                                return;
                            }
                            if(!isNaN((scale[0]))&&!isNaN(scale[1])&&!isNaN(scale[2]))
                                child.scale.set(scale[0],scale[2],scale[1]);
                        });
                    }
                    let rotationListener = (query:string, target:Spec)=>{
                        let rt = this.ui.specEngine.compile(target);
                        let rotation = <number[]> ((rt instanceof Number)? [rt, rt, rt]: rt);
                        this.meshList[specRoot.query].forEach( ( child:Mesh )=>{
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
                    let transformation = specRoot.findChild('/transformation');
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
                })
                break;
        }
    }

    setNewHost(element: HTMLElement) {
        this.canvas.setNewHost(element);
    }
}

class RaySelector{
    rayCaster = new THREE.Raycaster();
    camera: THREE.Camera;
    scene: THREE.Scene;
    canvas: Canvas;
    intersected: THREE.Mesh;

    pointer = new Vector2();
    constructor(canvas: Canvas){
        this.canvas = canvas;
        this.camera = canvas.camera;
        this.scene = canvas.scene;
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
        const intersects = this.rayCaster.intersectObjects( this.scene.children, false );
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

    constructor(camera: THREE.Camera, scene: THREE.Scene,
                renderer: THREE.WebGLRenderer, config: { perspective: boolean, dpp: number }, htmlElement: HTMLElement) {
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