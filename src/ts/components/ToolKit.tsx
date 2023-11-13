import {UI} from "../main";
import * as React from "react";
import List from "@mui/material/List";
import ListSubheader from "@mui/material/ListSubheader";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import HexagonIcon from "@mui/icons-material/Hexagon";
import ListItemText from "@mui/material/ListItemText";
import BlurOnIcon from "@mui/icons-material/BlurOn";
import FunctionsIcon from "@mui/icons-material/Functions";
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import Collapse from "@mui/material/Collapse";
import StarBorder from "@mui/icons-material/StarBorder";
import BorderStyleIcon from "@mui/icons-material/BorderStyle";
import WebhookTwoToneIcon from "@mui/icons-material/WebhookTwoTone";
import OutputIcon from "@mui/icons-material/Output";
import {Visual} from "../visual";
import {SvgIcon} from "@mui/material";

class ToolKit extends React.Component<{ui: UI, visual: Visual, open: string}>{
    visual: Visual;
    ui: UI;
    expanded = false;
    constructor(props:{ui: UI, visual: Visual, open: string}){
        super(props);
        this.visual = props.visual;
        this.ui = props.ui;
        this.handleClick = this.handleClick.bind(this);
    }
    handleClick (target: string) {
        if(target == this.props.open)
            this.visual.closeSpec();
        else
            this.visual.openSpec(target);
    };
    render(){
        let opened = this.props.open;
        return (<List
            sx={{ width: '100%', maxWidth: 360, bgcolor: 'background.paper' }}
            component="nav"
            aria-labelledby="nested-list-subheader"
            subheader={
                <ListSubheader component="div" id="nested-list-subheader">
                    [Computation Library] Options
                </ListSubheader>
            }

        >
            <ToolKitItem {...this.props} target='geometry'/>
            <ToolKitItem {...this.props} target='space'/>
            <ToolKitItem {...this.props} target='solver'/>
            <ToolKitItem {...this.props} target='boundary_conditions'/>
            <ToolKitItem {...this.props} target='materials'/>
            <ToolKitItem {...this.props} target='output'/>
        </List>
    );
    }
}

const iconMap:{[key: string]:any} = {
    'geometry': <HexagonIcon />,
    'space': <BlurOnIcon />,
    'solver': <FunctionsIcon />,
    'boundary_conditions': <BorderStyleIcon />,
    'materials':  <WebhookTwoToneIcon />,
    'output': <OutputIcon />,
};

class ToolKitItem extends React.Component<{ui: UI, visual: Visual, target: string, open: string}>{
    visual: Visual;
    ui: UI;
    constructor(props:{ui: UI, visual: Visual, target: string, open: string}){
        super(props);
        this.visual = props.visual;
        this.ui = props.ui;
        this.handleClick = this.handleClick.bind(this);
    }
    handleClick () {
        if(this.props.target == this.props.open)
            this.visual.closeSpec();
        else{
            this.visual.openSpec(this.props.target);
        }
    };
    toRenderedText(original:string) {
         let stringArray:string[]=original.split('_');
         for(let i =0;i<stringArray.length; i++){
             stringArray[i]= stringArray[i].charAt(0).toUpperCase() + stringArray[i].slice(1);
         }
         return stringArray.join(' ');
    }
    render(){
        let opened = this.props.open;
        let selfTarget = this.props.target;
        let renderedText = this.toRenderedText(selfTarget);
        let selected = opened==selfTarget;
        return  <ListItemButton onClick={()=>this.handleClick()}  style={{color:(selected?'#3f50b5':undefined)}}>
            <ListItemIcon style={{color:(selected?'#3f50b5':undefined)}}>
                {iconMap[selfTarget]}
            </ListItemIcon>
            <ListItemText primary={renderedText} sx={{'& *':{fontWeight: selected? 'bold':'normal'}}}/>
            { selected? <ChevronRightIcon /> : <ChevronLeftIcon />}
        </ListItemButton>
    }
}

export {ToolKit};