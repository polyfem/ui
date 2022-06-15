import './graphics';
import {UFile, UFileSystem} from './server';
import {FilePanel} from './ui';
import {createElement} from "react";
import {createRoot} from "react-dom/client";
import {App} from "./graphics";

/**
 * Central instance of PolyFEM UI
 */
class Main{
    fs: UFileSystem;
    rootURL = ".";
    canvas: App;
    container: HTMLElement;
    constructor(){
        this.fs = new UFileSystem(this.rootURL);
        this.canvas = new App();
        this.container = document.getElementById("container");
        this.loadUI();
    }
    loadUI(){
        let fp = createElement(FilePanel, {'main': this});
        let root = createRoot(document.getElementById("filePanel"));
        root.render(fp);
        console.log(root);
    }
    loadFile(file: UFile){
        let extension = file.name.split('.').pop();
        switch(extension){
            case "glb":
                this.canvas.loadObject(file.url);
                this.canvas.dom.style.zIndex = "1";
                this.container.style.zIndex = "0";
                break;
            case "json":
                this.canvas.dom.style.zIndex = "0";
                this.container.style.zIndex = "1";
                this.container.children[0].innerHTML = `{
    "problem": "GenericTensor",
    "tensor_formulation": "NeoHookean",
    "solver_type": "Hypre",
    "n_refs": 0,
    "discr_order": 1,
    "iso_parametric": false,
    "vismesh_rel_area": 1,
    "export": {
\t\t"paraview": "sol.vtu",
        "volume": true
    },
    "has_collision": false,
    "problem_params": {
        "dirichlet_boundary": 
        [
            {
                "id": 10,
                "value": [0, 0, 0]
            }
        ],
        "neumann_boundary":
        [
            {
                "id": 11,
                "value": [0, 0, -2000]
            },
            {
                "id": 12,
                "value": [0, 0, -2000]
            }
        ],
        "rhs": [0, 0, 0]
    },
    "params": {
        "E": 3.5e9,
        "nu": 0.36,
        "rho": 1240
    },
    "boundary_sidesets": [{
        "id": 10,
        "axis": "-z",
        "position": -0.009
    }, {
        "id": 11,
        "axis": "-y",
        "position": -0.11 
    }, {
        "id": 12,
        "axis": "y",
        "position": 0.11 
    }],
    "line_search": "bisection",
    "meshes": [
        {
            "mesh": "./beam.msh",
            "scale": 0.01,
            "body_id": 1
        } 
    ],
    "normalize_mesh": false
}
`.split('\n').join('<br>');
                break;
        }
    }
    loadFileRoot():UFile{
        return this.fs.fileRoot;
    }
}

new Main();

export {Main};