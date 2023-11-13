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
import { ThemeProvider, createTheme } from '@mui/material/styles';
import {SyntheticEvent} from "react";
import {UFile} from "./server";

const darkTheme = createTheme({
    palette: {
        mode: 'light',
    },
});

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
            // this.closeSpec();
            // return;
            specNode = this.ui.specEngine.query(`/${target}`,this.ui.specRoot);
            this.ui.specRoot.children[target] = specNode;
        }
        if(this.ui.activeSpec!=undefined){
            this.ui.activeSpec.selected = false;
        }
        specNode.selected = true;
        this.ui.activeSpec = specNode;
        this.setState({activeSpec: specNode});
    }
    closeSpec(){
        if(this.ui.activeSpec!=undefined){
            this.ui.activeSpec.selected = false;
        }
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
    onFileSelect(file:UFile){
        if(!file.isDir) {
            this.ui.openFile(file);
        }
    }
    render(){
        return <ThemeProvider theme={darkTheme}>
            <Box sx={{ display: 'grid' }}
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
                    <Box sx={{height: '100%', overflow: 'hidden', display:'grid',gridTemplateRows:'fit-content(50%) 1px 50%'}}>
                        <Box sx={{gridRow:'1 span 1'}}>
                            <ToolKit ui={this.ui} visual={this} open={this.state.activeSpec.name}/>
                        </Box>
                        <Divider/>
                        <Box sx={{gridRow:'3 span 1'}}>
                            <FileView{...this.props} onFileSelect={this.onFileSelect.bind(this)}/>
                        </Box>
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
            </Box>
        </ThemeProvider>;
    }
}

export{Visual};