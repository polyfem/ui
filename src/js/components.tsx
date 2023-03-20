import * as React from "react";
import {UFile} from "./server";
import {Main} from "./main";
// import {ConnectDragSource, useDrag} from 'react-dnd';

import ReactJson from 'react-json-view'
import {JSONFileControl} from "./FileControl";
import SettingsForm from "./settingsForm";
import Menu from "@mui/material/Menu";

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

class Directory extends React.Component<{ file: UFile, main: Main }, { expanded: boolean, anchorEl: HTMLElement, open: boolean}> {
    fileDiv: HTMLElement;
    constructor(props: { file: UFile, main: Main }) {
        super(props);
        if(props.file.name == "."){
            this.state = {expanded: true, anchorEl: undefined, open: false};
            props.file.ls();
        }else{
            this.state = {expanded: props.file.children.length!=0, anchorEl: undefined, open: false};
        }
        this.toggleExpanded = this.toggleExpanded.bind(this);
        this.handleFileRightClick = this.handleFileRightClick.bind(this);
        this.handleClose = this.handleClose.bind(this);
        this.handleInsert = this.handleInsert.bind(this);
    }

    handleFileRightClick(e){
        console.log(e);
        e.preventDefault();
        this.setState((prevState)=>{
            return {expanded: prevState.expanded, anchorEl: this.fileDiv, open: true};
        })
    }

    handleClose(e){
        this.setState((prevState)=>{
            return {expanded: prevState.expanded, anchorEl: undefined, open: false};
        });
    }

    handleInsert(e){
        console.log(this.props.main.activeFileControl);
        if(this.props.main.activeFileControl instanceof JSONFileControl){
            this.props.main.activeFileControl.insertGeometry(this.props.file);
        }
        this.setState((prevState)=>{
            return {expanded: prevState.expanded, anchorEl: undefined, open: false};
        });
    }

    render() {
        let file = this.props.file;
        let name = (file.name == ".") ? "./" : file.name;
        if (!file.isDir) {
            return (<div className="dirItem" >
                <div className="file-name" onClick={()=> this.props.main.loadFile(file)}
                     onContextMenu={this.handleFileRightClick}
                     ref={(el)=>{
                         this.fileDiv = el;
                     }}>{name}</div>
                <Menu
                    id="basic-menu"
                    anchorEl={this.state.anchorEl}
                    open={this.state.open}
                    onClose={this.handleClose}
                    MenuListProps={{
                        'aria-labelledby': 'basic-button',
                    }}
                    anchorOrigin={{
                        vertical: 'bottom',
                        horizontal: 'center',
                    }}
                    transformOrigin={{
                        vertical: 'top',
                        horizontal: 'left',
                    }}
                >
                    <MenuItem onClick={this.handleInsert}>
                        <ListItemIcon>
                            <DoubleArrow fontSize="small" />
                        </ListItemIcon>
                        <ListItemText>Insert</ListItemText>
                    </MenuItem>
                    <MenuItem onClick={this.handleClose}>
                        <ListItemIcon>
                            <ContentCopy fontSize="small" />
                        </ListItemIcon>
                        <ListItemText>Duplicate</ListItemText>
                    </MenuItem>
                </Menu>
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

import MenuItem from '@mui/material/MenuItem';
import ListItemText from '@mui/material/ListItemText';
import ListItemIcon from '@mui/material/ListItemIcon';
import ContentCopy from '@mui/icons-material/ContentCopy';
import DoubleArrow from "@mui/icons-material/DoubleArrow";

export {FilePanel, JSONPanel};
