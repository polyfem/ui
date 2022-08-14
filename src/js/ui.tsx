import * as React from "react";
import {UFile} from "./server";
import {Main} from "./main";
// import {ConnectDragSource, useDrag} from 'react-dnd';

import ReactJson from 'react-json-view'
import {JSONFileControl} from "./FileControl";
import SettingsForm from "./settingsForm";

class FilePanel extends React.Component<{ main: Main }, { root: UFile }> {
    main: Main;

    constructor(props: { main: Main }) {
        super(props);
        this.main = props.main;
        this.state = {root: props.main.loadFileRoot()};
    }

    listFiles(root: UFile) {
        console.log(root);
    }

    render() {
        return <Directory file={this.state.root} main={this.main}/>;
    }

    resizeLeft() {

    }

    resizeRight() {

    }
}

class Directory extends React.Component<{ file: UFile, main: Main }, { expanded: boolean }> {
    // dragRef: ConnectDragSource;
    constructor(props: { file: UFile, main: Main }) {
        super(props);
        // const [{ opacity }, dragRef] = useDrag(
        //     () => ({
        //         type: 'File',
        //         item: props.file.name,
        //         collect: (monitor) => ({
        //             opacity: monitor.isDragging() ? 0.5 : 1
        //         })
        //     }),
        //     []
        // )
        // this.dragRef = dragRef;
        if(props.file.name == "."){
            this.state = {expanded: true};
            props.file.ls();
        }else{
            this.state = {expanded: props.file.children.length!=0};
        }
        this.toggleExpanded = this.toggleExpanded.bind(this);
    }

    render() {
        let file = this.props.file;
        let name = (file.name == ".") ? "./" : file.name;
        if (!file.isDir) {
            return (<div className="dirItem" >
                <div className="file-name" onClick={() => this.props.main.loadFile(file)}>{name}</div>
            </div>);
        } else {
            return (<div className="dirItem">
                <h4 className="folder-name" onClick={this.toggleExpanded}>{name}</h4>
                {
                    this.state.expanded && file.children.map((child) => <Directory key={child.url} file={child}
                                                                                   main={this.props.main}/>)
                }
            </div>)
        }
    }

    toggleExpanded() {
        this.setState((state, props) => {
            if (!state.expanded) {
                props.file.ls();
            }
            return {expanded: !state.expanded};
        })
    }
}

class OperationPanel extends React.Component<{ main: Main }, {value: string}> {
    constructor(props) {
        super(props);
        this.state = {value:""};
        this.execute = this.execute.bind(this);
        this.handleChange = this.handleChange.bind(this);
    }
    render() {
        return <div id='operationPanel'>
            <form onSubmit={this.execute}>
            <label>
                <input type="text" value={this.state.value} onChange={this.handleChange} />
            </label>
                <input className='controlBtn' type='submit'  value='run' />
        </form>
        <SettingsForm/>
        </div>;
    }
    execute(event){
        event.preventDefault();
        this.props.main.executeCommand(this.state.value, (newResponse, response)=>{
            this.props.main.setResponse(response);
        });
    }
    handleChange(event){
        this.setState({value: event.target.value});
    }

}

class ControlPanel extends React.Component<{main: Main, execute: (command:string)=>void}>{
    constructor(props) {
        super(props);
    }
    render(){
        return <div id='controlPanel'>
        </div>;
    }
}
// Data
const data = {
    error: new Error('error'),
    text: 'text',
    int: 100,
    boolean: true,
    null: null,
    object: {
        text: 'text',
        int: 100,
        boolean: true,
    },
    array: [
        1,
        {
            string: 'test',
        },
    ],
}

class JSONPanel extends React.Component<{json: {}, control: JSONFileControl}>{
    constructor(props) {
        super(props);
        this.updateJSON = this.updateJSON.bind(this);
    }
    render(){
        return <ReactJson src={this.props.json} onEdit={this.updateJSON} onAdd={this.updateJSON} onDelete={this.updateJSON} collapsed={1}/>
    }
    updateJSON(json){
        this.props.control.jsonUpdated(json.updated_src);
    }
}

export {FilePanel, OperationPanel, JSONPanel};
