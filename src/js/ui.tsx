import * as React from "react";
import {UFile} from "./server";
import {Main} from "./main";
import {query} from "express";

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
    constructor(props: { file: UFile, main: Main }) {
        super(props);
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
            return (<div className="dirItem">
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

class OperationPanel extends React.Component<{ main: Main }, {output: string}> {
    constructor(props) {
        super(props);
        this.state = {output:""};
        this.execute = this.execute.bind(this);
    }
    render() {
        return <div id='operationPanel'>
            <button className='controlBtn' onClick={
                (e)=>this.execute("default")}>execute command</button>
        </div>;
    }
    execute(command: string){
        this.props.main.executeCommand(command, (newResponse, response)=>{
            this.props.main.setResponse(response);
        });
    }

    updateText(output: string) {
        this.setState({output: output});
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

export {FilePanel, OperationPanel};
