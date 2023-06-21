import {UI} from "./main";
import * as React from "react";
import {ToolKit} from "./components/ToolKit";
import NavBar from "./components/NavBar";
import Box from '@mui/material/Box';
import Drawer from '@mui/material/Drawer';
import CssBaseline from '@mui/material/CssBaseline';
import Toolbar from '@mui/material/Toolbar';
import Divider from '@mui/material/Divider';
import AppBar from "@mui/material/AppBar";
import EditorPane from "./components/EditorPane";
import FileView from "./components/FileView";
import {Spec} from "./spec";
import {FileControl} from "./fileControl";


const drawerWidth = 300;

class Visual extends React.Component<{ui: UI, rootId: string}, {open:boolean, activeSpec: Spec,
    activeFile: number, openedFiles: FileControl[]}>{
    ui: UI;
    constructor(props:{ui: UI, rootId: string}){
        super(props);
        this.ui = props.ui;
        this.state = {open:true, activeSpec: props.ui.activeSpec,
            activeFile:undefined, openedFiles:[]};
        this.ui.vs = this;
    }
    openSpec(target: string){
        let specNode = this.ui.specRoot.children[target];
        if(specNode==undefined){
            this.closeSpec();
            return;
        }
        this.ui.activeSpec = specNode;
        this.setState({activeSpec: specNode});
    }
    closeSpec(){
        this.ui.activeSpec = this.ui.emptySpec;
        this.setState({activeSpec: this.ui.activeSpec});
    }
    updateSpec(){
        this.setState({activeSpec: this.ui.activeSpec});
    }
    setActiveFile(activeFile: number){
        this.setState({activeFile: activeFile});
    }
    setOpenedFiles(files: FileControl[]){
        this.setState({openedFiles: files});
    }
    render(){
        return <Box sx={{ display: 'grid' }}
                    style={{gridTemplateColumns: `${drawerWidth}px 1fr`,
                            gridTemplateRows: `64px minmax(0,1fr)`,
                            height: '100%'}}>
            <CssBaseline/>
            <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1}}
                    style={{gridColumn: '1 / span 2',
                        gridRow: '1 / span 1', boxShadow: 'none'}}>
                <NavBar/>
            </AppBar>
            <Drawer
                variant="permanent"
                sx={{
                    width: drawerWidth,
                    flexShrink: 0,
                    [`& .MuiDrawer-paper`]: { width: drawerWidth, boxSizing: 'border-box' },
                }}
                style={{gridColumn: '1 / span 1',
                gridRow: '2 / span 1'}}
            >
                <Toolbar />
                <Box sx={{height: '100%', overflow: 'hidden'}}>
                    <ToolKit ui={this.ui} visual={this} open={this.state.activeSpec.name}/>
                    <Divider />
                    <FileView{...this.props}/>
                </Box>
            </Drawer>
            <Box sx={{ flexGrow: 1, p: 3 }}
                 style={{gridColumn: '2 / span 1',
                     gridRow: '2 / span 1', padding:'0'}}>
                <EditorPane {...this.props} specRoot={this.state.activeSpec}
                            openedFiles={this.state.openedFiles}
                            activeFile ={this.state.activeFile}
                />
            </Box>
        </Box>;
    }
}

export{Visual};