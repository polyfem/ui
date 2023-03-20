import * as React from "react";
import {UI, Spec} from "../main";
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

class SpecPane extends React.Component<{ui: UI, rootId: string, specRoot: Spec}, any>{
    render(){
        let {ui, rootId, specRoot} = this.props;
        return <Box style={{marginLeft: '5pt', marginTop:'5pt'}}>
            <SpecFieldV ui={ui} rootId={rootId} specNode={specRoot}/>
        </Box>;
    }
}

//Spec field view
const SpecFieldV = function({ui, rootId, specNode}: {ui: UI, rootId: string, specNode: Spec}){
    let [expanded, setExpanded] = useState(true);
    if(specNode.isLeaf){
        return <span style={{display:'flex', flexDirection:'row', alignItems:'baseline'}}>
            <label style={{verticalAlign: 'baseline', marginRight: '6pt'}}>
                {specNode.name}:
            </label>
            <TextField
                FormHelperTextProps={{style:{textAlign: 'right', color: '#037746'}}}
                size="small"
                variant="standard"
                helperText={specNode.type}
                style={{verticalAlign: 'baseline'}}/>
        </span>
    }else{
        return <span style={{display:'flex', flexDirection:'row', alignItems:'baseline'}}>
            <label style={{verticalAlign: 'baseline', marginRight: '6pt'}}>
                {(!expanded)? <ChevronRightIcon/>:
                    <ExpandMoreIcon/>}
                    {specNode.name}:
                </label>
            <Collapse in={expanded} timeout="auto" unmountOnExit>
                {specNode.subNodes.map((value, index, array)=>(<SpecFieldV ui={ui} rootId={rootId} specNode={value}/>))}
            </Collapse>
        </span>;
    }
}

export default SpecPane;