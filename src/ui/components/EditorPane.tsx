import {UI} from "../main";
import * as React from "react";
import Typography from "@mui/material/Typography";
import { styled } from '@mui/material/styles';
import MuiGrid from '@mui/material/Grid';
import Divider from '@mui/material/Divider';
import KeyboardDoubleArrowRightIcon from '@mui/icons-material/KeyboardDoubleArrowRight';
import SpecPane from "./SpecPane";
import {Box, IconButton, Tabs, Tab} from "@mui/material";
import CloseIcon from '@mui/icons-material/Close';
import ThreePane from "./ThreePane";
import {FileControl, GFileControl} from "../fileControl";
import {Spec} from "../spec";
import {CodeFileDisplay} from "./CodeFileDisplay";

const Grid = styled(MuiGrid)(({ theme }) => ({
    width: '100%',
    height: '100%',
    ...theme.typography.body2,
    '& [role="separator"]': {
        margin: theme.spacing(0, 2),
    },
}));


class EditorPane extends React.Component<{ui: UI, rootId: string, specRoot: Spec,
    openedFiles: FileControl[],
    activeFile: number
}, any>{
    render(){
        return <div style={{display: 'grid',
            width: '100%',
            height: '100%',
            gridTemplateColumns: '25% 6px minmax(0,1fr)',
            gridTemplateRows: '45px 1fr'}}>
            <SpecPane {...this.props} specRoot={this.props.specRoot}/>
            <Divider orientation="vertical" style={{gridColumn:'2 / span 1',  gridRow:'1 / span 2', backgroundColor:'#555'}}>
                <KeyboardDoubleArrowRightIcon/>
            </Divider>
            <div style={{gridColumn:'3 / span 1', gridRow:'1 / span 2'}}>
                <TabPane {...this.props}/>
            </div>
        </div>;
    }
}

interface TabPanelProps {
    children?: React.ReactNode;
    index: number;
    value: number;
}

function TabPanel(props: TabPanelProps) {
    const { children, value, index, ...other } = props;
    return (
        // <div style={{height:`${window.innerHeight*0.75}px`, overflow: 'auto' }}>
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`simple-tabpanel-${index}`}
            aria-labelledby={`simple-tab-${index}`}
            {...other}
            style={{height:'100%', width:'100%', overflow:'auto', background:'#333333'}}
        >
            {value === index && (
                <Box sx={{ height:'100%', width:'100%'}}>
                    {children}
                </Box>
            )}
        </div>
    );
}

function a11yProps(index: number) {
    return {
        id: `simple-tab-${index}`,
        'aria-controls': `simple-tabpanel-${index}`,
    };
}

class TabPane extends React.Component<{ui:UI, rootId: string,
    openedFiles: FileControl[],
    activeFile: number}, {value: number}>{
    control: GFileControl;
    ui: UI;
    constructor(props: {ui:UI, rootId: string,
        openedFiles: FileControl[],
        activeFile: number}) {
        super(props);
        this.ui = props.ui;
        this.handleChange = this.handleChange.bind(this);
        this.state={value: 0};
    }
    handleChange (event: React.SyntheticEvent, newValue: number) {
        this.ui.setActiveFile(newValue);
    }
    handleClose(event: React.SyntheticEvent, item: FileControl){
        event.stopPropagation();
        this.ui.closeFile(item);
    }
    render(){
        let value = this.props.activeFile;
        return (
            <Box sx={{ width: '100%', height:'100%', backgroundColor:'#333'}}>
                <Box sx={{ borderBottom: 1, borderColor: '#777', backgroundColor:'#333'}}>
                    <Tabs value={value} onChange={this.handleChange}
                          textColor='inherit'
                          TabIndicatorProps={{
                              sx: {
                                  backgroundColor: "navajowhite",
                              }
                          }}
                          sx={{height: '17pt', padding: '0pt'}} aria-label="basic tabs example">
                        {this.props.openedFiles.map((item, index)=>{
                            return <Tab label={item.fileName} sx={{color:(value==index)?'navajowhite':'white'}} {...a11yProps(index)}
                                 icon={<CloseIcon onClick={(e)=>this.handleClose(e,item)}/>}  key={item.fileReference.url} iconPosition="end" />;
                        })}
                    </Tabs>
                </Box>

                {//File is panels are populated here
                    this.props.openedFiles.map((item, index)=>{
                    if(item instanceof GFileControl){
                        item.fileDisplay = <ThreePane
                            ui={this.props.ui} rootId={this.props.rootId}
                            fileControl={item}/>;
                        item.fileDisplay2 = <CodeFileDisplay ui={this.props.ui} rootId={this.props.rootId} fileControl={item}/>;
                    }else{
                        item.fileDisplay = <CodeFileDisplay ui={this.props.ui} rootId={this.props.rootId} fileControl={item}/>
                    }
                    return <TabPanel value={value} key={`${item.fileReference.url}-${item.fileReference.editCount}`} index={index}>
                        {item.fileDisplay}
                    </TabPanel>;
                })}
            </Box>
        );
    }
}

export default EditorPane;