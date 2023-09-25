import * as THREE from 'three';
import {FileControl, GeometryJSONStruct, GFileControl} from "./fileControl";
import { OrbitControls } from './external/OrbitControls';
import {OrbitControlsGizmo} from './external/OrbitControlsGizmo.js';
import { GLTFLoader } from './external/GLTFLoader.js';
import {OBJLoader} from './external/OBJLoader.js';
import {TransformControls} from "./external/TransformControls.js";
import GeometryController from "./graphics/GeometryController";

import GUI from 'lil-gui';


import {
    AxesHelper, Box3,
    GridHelper, Material,
    Mesh,
    MeshBasicMaterial,
    MeshNormalMaterial,
    MeshPhongMaterial, Quaternion, ShaderMaterial, Vector2, Vector3,
    WebGLRenderer
} from "three";
import {UFile} from "./server";
import {UI} from "./main";
import {Spec, SpecEngine} from "./spec";
import BoxSelector from "./graphics/BoxSelector";
import RaySelector from "./graphics/RaySelector";
import SphereSelector from "./graphics/SphereSelector";
import PlaneSelector from "./graphics/PlaneSelector";
import AxisSelector from "./graphics/AxisSelector";

const selectionMaterial = new MeshPhongMaterial({color: 0xffaa55, visible:true,
    emissive:0xffff00, emissiveIntensity:0.1, side: THREE.DoubleSide});
const selectionMaterial2 = new MeshPhongMaterial({color: 0xabcdef, visible:true,
    emissive:0x00ffff, emissiveIntensity:0.2, side: THREE.DoubleSide});
// const regularMaterial = new MeshPhongMaterial({side: THREE.DoubleSide});

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
    meshList: {[id: number]:GeometryController[]}={};
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
            let rotationMode = this.activeGeometry.findChild('transformation/rotation_mode')?.value;
            rotationMode = rotationMode==undefined?'euler':rotationMode.toLowerCase();
            transformation.type = 'list';
            if(transformation.subNodesCount<3){
                for(let i = 0; i<3; i++){
                    transformation.pushChild(new Spec(`${i}`, transformation, true));
                }
            }
            if(this.activeEdit=='rotation'&&transformation.subNodesCount<4&&rotationMode=='quaternion')
                while(transformation.subNodesCount<4){
                    transformation.pushChild(new Spec('',transformation, true));
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
                        if(rotationMode=='euler'){
                            rotations[0].setValue(this.activeMesh.rotation.x);
                            rotations[1].setValue(this.activeMesh.rotation.y);
                            rotations[2].setValue(this.activeMesh.rotation.z);
                        }else if(rotationMode=='quaternion'){
                            let quaternion = this.activeMesh.quaternion;
                            rotations[0].setValue(quaternion.x);
                            rotations[1].setValue(quaternion.y);
                            rotations[2].setValue(quaternion.z);
                            rotations[3].setValue(quaternion.w);
                        }
                    break;
                case 'scale':
                    let scale = transformation.children;
                    scale[0].setValue(this.activeMesh.scale.x);
                    scale[1].setValue(this.activeMesh.scale.y);
                    scale[2].setValue(this.activeMesh.scale.z);
                    this.updateSelectors(this.activeGeometry);
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

    updateSelectors(geometrySpec: Spec){
        let controllers = this.meshList[geometrySpec.sid];
        controllers.forEach((value)=>{
            value.updateSelectors();
        });
    }

    /**
     * Load listeners on a per geometry basis
     */
    addJSONListeners(geometrySpec: Spec){
        geometrySpec.subscribeChangeService((query, target,event)=>{
            if(event=='cd'&&query==geometrySpec.query){
                let controllers = this.meshList[geometrySpec.sid];
                for(let key in controllers){
                    this.canvas.scene.remove(controllers[key].mesh);
                }
            }
        });
        const selection2Listener=(target: Spec, selected: boolean)=>{
            if(selected&&!target.selected){
                for(let controller of this.meshList[target.sid]){
                    // previousMaterial = mesh.material;
                    controller.mesh.material = selectionMaterial2;
                }
                setTimeout( ()=>{
                    for(let controller of this.meshList[target.sid]){
                        controller.mesh.material = controller.material;
                    }
                }, 500);
            }else if(!selected&&!target.selected){
                for(let controller of this.meshList[target.sid]){
                    controller.mesh.material = controller.material;
                }
            }
        }
        const selectionListener=(target: Spec, selected: boolean)=>{
            if(selected){
                for(let controller of this.meshList[target.sid]){
                    // previousMaterial = mesh.material;
                    controller.mesh.material = selectionMaterial;
                }
                setTimeout( ()=>{
                    for(let controller of this.meshList[target.sid]){
                        controller.mesh.material = controller.material;
                    }
                }, 500);
            }else if(!selected&&!target.secondarySelected){
                for(let controller of this.meshList[target.sid]){
                    controller.mesh.material = controller.material;
                }
            }
        }

        geometrySpec.subscribeSelectionService(selectionListener, true);
        geometrySpec.subscribeSelectionService(selection2Listener, false);


        let geometryControllers = this.meshList[geometrySpec.sid];
        const subscribeBoxSelector = (boxSelectorSpec: Spec, surface: boolean)=>{
            for(let geometryController of geometryControllers){
                let boxSelector = new BoxSelector(this, surface, boxSelectorSpec, geometryController, geometryController.selectionCount++);
                // surfaceSelection.subscribeSelectionService(boxSelector.selectionListener, false);
                boxSelectorSpec.subscribeChangeService(boxSelector.surfaceSelectionListener)
                (boxSelectorSpec.query,boxSelectorSpec,'v');
                boxSelectorSpec.parent.subscribeSelectionService(boxSelector.parentSelectionListener, false);
                boxSelectorSpec.subscribeChangeService((query, taret, event)=>{
                    if(event=='cd'&&query==boxSelectorSpec.query){
                        boxSelector.detach();
                    }
                });
            }
        };
        const subscribeSphereSelector = (sphereSelectorSpec: Spec, surface: boolean)=>{
            for(let geometryController of geometryControllers){
                let sphereSelector = new SphereSelector(this, surface, sphereSelectorSpec, geometryController, geometryController.selectionCount++);
                // surfaceSelection.subscribeSelectionService(boxSelector.selectionListener, false);
                sphereSelectorSpec.subscribeChangeService(sphereSelector.surfaceSelectionListener)
                (sphereSelectorSpec.query,sphereSelectorSpec,'v');
                sphereSelectorSpec.parent.subscribeSelectionService(sphereSelector.parentSelectionListener, false);
                sphereSelectorSpec.subscribeChangeService((query, taret, event)=>{
                    if(event=='cd'&&query==sphereSelectorSpec.query){
                        sphereSelector.detach();
                    }
                });
            }
        };
        const subscribePlaneSelector = (planeSelectorSpec: Spec, surface: boolean)=>{
            for(let geometryController of geometryControllers){
                let planeSelector = new PlaneSelector(this, surface, planeSelectorSpec, geometryController, geometryController.selectionCount++);
                // surfaceSelection.subscribeSelectionService(boxSelector.selectionListener, false);
                planeSelectorSpec.subscribeChangeService(planeSelector.surfaceSelectionListener)
                (planeSelectorSpec.query,planeSelectorSpec,'v');
                planeSelectorSpec.parent.subscribeSelectionService(planeSelector.parentSelectionListener, false);
                planeSelectorSpec.subscribeChangeService((query, taret, event)=>{
                    if(event=='cd'&&query==planeSelectorSpec.query){
                        planeSelector.detach();
                    }
                });
            }
        };
        const subscribeAxisSelector = (axisSelectorSpec: Spec, surface: boolean)=>{
            for(let geometryController of geometryControllers){
                let axisSelector = new AxisSelector(this, surface, axisSelectorSpec, geometryController, geometryController.selectionCount++);
                // surfaceSelection.subscribeSelectionService(boxSelector.selectionListener, false);
                axisSelectorSpec.subscribeChangeService(axisSelector.surfaceSelectionListener)
                (axisSelectorSpec.query,axisSelectorSpec,'v');
                axisSelectorSpec.parent.subscribeSelectionService(axisSelector.parentSelectionListener, false);
                axisSelectorSpec.subscribeChangeService((query, taret, event)=>{
                    if(event=='cd'&&query==axisSelectorSpec.query){
                        axisSelector.detach();
                    }
                });
            }
        };
        const subscribeSurfaceSelections = ()=>{
            // Selection path geometryObject/surface_selection
            let surfaceSelections = geometrySpec.matchChildren(...'/surface_selection'.split('/'));
            for(let surfaceSelection of surfaceSelections){
                let selectorSpecs = surfaceSelection.matchChildren(...'/*'.split('/'));
                for(let selectorSpec of selectorSpecs){
                    if(selectorSpec.typename=='box'){
                        subscribeBoxSelector(selectorSpec,true);
                    }else if(selectorSpec.typename=='sphere'){
                        subscribeSphereSelector(selectorSpec,true);
                    }else if(selectorSpec.typename == 'plane'){
                        subscribePlaneSelector(selectorSpec,true);
                    }else if(selectorSpec.typename == 'axis'){
                        subscribeAxisSelector(selectorSpec,true);
                    }
                }
                surfaceSelection.subscribeChangeService((query,target, event)=>{
                    if(event=='ca'&&SpecEngine.matchQueries(query,'/geometry/*/surface_selection/*')){
                        let selectorSpec = this.fileControl.specRoot.findChild(query);
                        switch(selectorSpec.typename){
                            case 'box':
                                subscribeBoxSelector(selectorSpec,true);
                                break;
                            case 'sphere':
                                subscribeSphereSelector(selectorSpec,true);
                                break;
                            case 'plane':
                                subscribePlaneSelector(selectorSpec,true);
                                break;
                            case 'axis':
                                subscribeAxisSelector(selectorSpec,true);
                                break;
                        }
                    }
                });
            }
        }
        geometrySpec.subscribeChangeService((query, target, event)=>{
            if(event=='ca'&&SpecEngine.matchQueries(query,'/geometry/*/surface_selection'))
                subscribeSurfaceSelections();
            else if(event=='cd'&&SpecEngine.matchQueries(query,'/geometry/*/surface_selection')){
                for(let key in geometryControllers){
                    let controller = geometryControllers[key];
                    for(let selectorKey in controller.selectors){
                        let selector = controller.selectors[selectorKey];
                        if(selector.isSurfaceSelector)
                            selector.detach();
                    }
                }
            }
        });
        subscribeSurfaceSelections();

        const subscribeVolumeSelections = ()=>{
            let volumeSelections = geometrySpec.matchChildren(...'/volume_selection'.split('/'));
            for(let volumeSelection of volumeSelections){
                let selectorSpecs = volumeSelection.matchChildren(...'/*'.split('/'));
                for(let selectorSpec of selectorSpecs){
                    if(selectorSpec.typename=='box'){
                        subscribeBoxSelector(selectorSpec,false);
                    }else if(selectorSpec.typename=='sphere'){
                        subscribeSphereSelector(selectorSpec,false);
                    }else if(selectorSpec.typename == 'plane'){
                        subscribePlaneSelector(selectorSpec,false);
                    }else if(selectorSpec.typename == 'axis'){
                        subscribeAxisSelector(selectorSpec,false);
                    }
                }
                volumeSelection.subscribeChangeService((query,target, event)=>{
                    if(event=='ca'&&SpecEngine.matchQueries(query,'/geometry/*/volume_selection/*')){
                        let selectorSpec = this.fileControl.specRoot.findChild(query);
                        switch(selectorSpec.typename){
                            case 'box':
                                subscribeBoxSelector(selectorSpec,false);
                                break;
                            case 'sphere':
                                subscribeSphereSelector(selectorSpec,false);
                                break;
                            case 'plane':
                                subscribePlaneSelector(selectorSpec,false);
                                break;
                            case 'axis':
                                subscribeAxisSelector(selectorSpec,false);
                                break;
                        }
                    }
                });
            }
        }
        geometrySpec.subscribeChangeService((query, target, event)=>{
            if(event=='ca'&&SpecEngine.matchQueries(query,'/geometry/*/volume_selection'))
                subscribeVolumeSelections();
            else if(event=='cd'&&SpecEngine.matchQueries(query,'/geometry/*/volume_selection')){
                for(let key in geometryControllers){
                    let controller = geometryControllers[key];
                    for(let selectorKey in controller.selectors){
                        let selector = controller.selectors[selectorKey];
                        if(!selector.isSurfaceSelector)
                            selector.detach();
                    }
                }
            }
        });
        subscribeVolumeSelections();

        const translationListener = (query:string, target:Spec)=>{
            let tr = this.ui.specEngine.compile(target);
            if(tr instanceof Array&&tr.length<3)
                return;
            let translation = <number[]>((tr instanceof Number)? [tr, tr, tr]: tr);
            this.meshList[geometrySpec.sid].forEach( ( controller:GeometryController )=>{
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
            this.meshList[geometrySpec.sid].forEach( ( controller:GeometryController )=>{
                let child = controller.mesh;
                if(this.pauseGeometryUpdate||child instanceof THREE.Group){
                    return;
                }
                if(!isNaN((scale[0]))&&!isNaN(scale[1])&&!isNaN(scale[2]))
                    child.scale.set(scale[0],scale[1],scale[2]);
                controller.updateSelectors();
            });
        }
        const rotationListener = (query:string, target:Spec)=>{
            if(target==undefined)
                return;
            let rotation = this.ui.specEngine.compile(target);
            let rotationMode = <string>this.ui.specEngine.compile(target.parent.findChild('rotation_mode'));
            rotationMode = rotationMode==undefined?'euler':rotationMode.toLowerCase();
            if(['quaternion','euler'].indexOf(rotationMode)<0
                ||rotation instanceof  Number || rotation instanceof Array&&rotation.length<3)
                return;
            this.meshList[geometrySpec.sid].forEach( ( controller:GeometryController )=>{
                let child = controller.mesh;
                if(this.pauseGeometryUpdate||child instanceof THREE.Group){
                    return;
                }
                if(!isNaN((rotation[0]))&&!isNaN(rotation[1])&&!isNaN(rotation[2]))
                    if(rotationMode=='quaternion'&&!isNaN(rotation[3])){
                        child.setRotationFromQuaternion(new Quaternion(rotation[0],rotation[1],rotation[2],rotation[3]))
                    }
                    else if(rotationMode=='euler')
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
                    case 'rotation_mode':
                        target.subscribeChangeService(()=>{
                            rotationListener(query,target.parent.findChild('rotation'));
                        });
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
                    case 'rotation_mode':
                        target.subscribeChangeService(()=>{
                            rotationListener(target.query,target.parent.findChild('rotation'));
                        });
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
        if(geometry.mesh==undefined)
            return;
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
                        if(this.meshList[specRoot.sid]==undefined)
                            this.meshList[specRoot.sid] = [];
                        let controller = new GeometryController(child);
                        this.meshList[specRoot.sid].push(controller);
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
        const gui = new GUI({container:htmlElement});
        gui.domElement.style.position='absolute';
        gui.domElement.style.top = '0';
        gui.domElement.style.left = '0';
        const folder = gui.addFolder( 'Folder' );

        const folderParams = {
            number: 0.5,
            boolean: false,
            color: '#0cf',
            function() { console.log( 'hi' ) }
        };

        folder.add( folderParams, 'number', 0, 1 );
        folder.add( folderParams, 'boolean' );
        folder.addColor( folderParams, 'color' );
        folder.add( folderParams, 'function' );

        const params = {
            options: 10,
            boolean: true,
            string: 'lil-gui',
            number: 0,
            color: '#aa00ff',
            function() { console.log( 'hi' ) }
        };

        gui.add( params, 'options', { Small: 1, Medium: 10, Large: 100 } );
        gui.add( params, 'boolean' );
        gui.add( params, 'string' );
        gui.add( params, 'number' );
        gui.addColor( params, 'color' );
        gui.add( params, 'function' ).name( 'Custom Name' );

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