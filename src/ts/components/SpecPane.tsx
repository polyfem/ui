import * as React from "react";
import {UI} from "../main";
import {Spec} from "../spec";
import TreeView from "@mui/lab/TreeView";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import TreeItem from "@mui/lab/TreeItem";
import {Box, TextField, Typography} from "@mui/material";
import MuiGrid from "@mui/material/Grid";
import {useState} from "react";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import StarBorder from "@mui/icons-material/StarBorder";
import ListItemText from "@mui/material/ListItemText";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import Collapse from "@mui/material/Collapse";
import FunctionsIcon from "@mui/icons-material/Functions";
import {ListItem} from "@mui/material";

class SpecPane extends React.Component<{ui: UI, rootId: string, specRoot: Spec}, any>{
    render(){
        let {ui, rootId, specRoot} = this.props;
        return <Box style={{marginLeft: '15pt', marginTop:'15pt', height:'100%', overflow:'auto'}}>
            <List>
                <SpecFieldV ui={ui} rootId={rootId} specNode={specRoot} level={0}/>
            </List>
        </Box>;
    }
}

//Spec field view
const SpecFieldV = function({ui, rootId, specNode, level}: {ui: UI, rootId: string, specNode: Spec, level: number}){
    let [expanded, setExpanded] = useState(true);
    const handleClick = ()=>{
       setExpanded(!expanded);
    };
    if(specNode.isLeaf){
        return <ListItem sx={{ pl: level, alignItems:'baseline'}}>
            <label style={{verticalAlign: 'baseline', marginRight: '6pt', fontSize: '11pt'}}>
                {specNode.name}:
            </label>
            <TextField
                FormHelperTextProps={{style:{textAlign: 'right', color: '#037746'}}}
                size="small"
                variant="standard"
                helperText={specNode.type}
                style={{verticalAlign: 'baseline'}}/>
        </ListItem>;
        // <span style={{display:'flex', flexDirection:'row', alignItems:'baseline'}}>
        // </span>;
    }else{
        return <React.Fragment>
            <ListItemButton onClick={handleClick} sx={{ pl: level}}>
                <ListItemText primary={specNode.name} primaryTypographyProps={{fontSize: '11pt'}}  />
                { expanded ? <ExpandMoreIcon /> : <ChevronRightIcon />}
            </ListItemButton>
            <Collapse in={expanded} timeout="auto" unmountOnExit>
                <List component="div" disablePadding>
                    {specNode.subNodes.map((node)=>
                        (<SpecFieldV ui={ui} rootId={rootId} specNode={node} level={level+1}/>))}
                </List>
            </Collapse>
            {/*<Collapse in={expanded} timeout="auto" unmountOnExit>*/}
            {/*    {specNode.subNodes.map((value, index, array)=>(<SpecFieldV ui={ui} rootId={rootId} specNode={value}/>))}*/}
            {/*</Collapse>*/}
        </React.Fragment>
    }
}

export default SpecPane;