import * as React from "react";
import {UI} from "../main";
import {Spec} from "../spec";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import {Box, TextField, Tooltip, Typography} from "@mui/material";
import {useState} from "react";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemText from "@mui/material/ListItemText";
import Collapse from "@mui/material/Collapse";
import {ListItem} from "@mui/material";
import SpecCreator from "./SpecCreator";

class SpecPane extends React.Component<{ui: UI, rootId: string, specRoot: Spec}, any>{
    render(){
        let {ui, rootId, specRoot} = this.props;
        return (specRoot.name=='none')?
            <Box style={{marginLeft: '15pt', marginTop:'15pt', height:'100%', overflow:'auto'}}>
                No [Computation Library] Options Selected
            </Box>:
            (specRoot.name=='undefined')?
            <Box style={{marginLeft: '15pt', marginTop:'15pt', height:'100%', overflow:'auto'}}>
                File Does Not Contain Specification
            </Box>
            :<Box style={{height:'100%', overflow:'auto'}}>
            <List>
                <SpecFieldV ui={ui} index={-1} specNode={specRoot} level={0} selected={true} select={()=>{}}/>
            </List>
        </Box>;
    }
}

//Spec field view
const SpecFieldV = function({ui, index, specNode, level, selected, select}:
                                {ui: UI, index: number, specNode: Spec,
                                    level: number, selected:boolean, select:(key:number)=>void}){
    let [expanded, setExpanded] = useState(level<2);
    //For usage with lists
    let [selection, setSelection] = useState(0);
    const handleClick = ()=>{
       setExpanded(!expanded);
       select(index);
    };
    const selectChild=(index:number)=>{
        if(index==selection)//Toggle or select
            setSelection(-1);
        else
            setSelection(index);
    }
    if(specNode.isLeaf){
        return <ListItem sx={{ pl: 2+level-1, alignItems:'baseline'}}>
            <Tooltip title={specNode.doc} arrow>
                <label style={{verticalAlign: 'baseline', marginRight: '6pt', fontSize: '11pt'}}>
                    {specNode.name}:
                </label>
            </Tooltip>
            <TextField
                FormHelperTextProps={{style:{textAlign: 'right', color: '#037746'}}}
                size="small"
                variant="standard"
                helperText={specNode.type}
                style={{verticalAlign: 'baseline'}} value={specNode.value}/>
        </ListItem>;
        // <span style={{display:'flex', flexDirection:'row', alignItems:'baseline'}}>
        // </span>;
    }else{
        //Determine whether self is expanded conditional on if self is an list element or an object element
        let expand = (index==-1)?expanded:selected;
        //Give preview text of list items if they are not expanded
        let primary = specNode.name;
        if(index!=-1&&!expand){
            let children = specNode.children;
            let keys = Object.keys(children);
            let enumeration = '';
            for(let i = 0; i<2; i++){
                enumeration+=`${keys[i]}: ${children[keys[i]].value}${(i!=keys.length-1)?', ':'...'}`;
            }
            enumeration = enumeration.substring(0,17);
            primary += `:   ${specNode.type=='list'? '[':'{'}${enumeration}...${specNode.type=='list'? ']':'}'}`
        }
        return <React.Fragment>
            {(level!=0)?
                <Tooltip
                    placement="right"
                    arrow title={specNode.doc} >
                    <ListItemButton onClick={handleClick}
                                    sx={{ pl: 2+level-1,
                                        background:(specNode.editing||specNode.secondarySelected)?'aliceblue':((specNode.selected)?'#ffd400':undefined)}}>
                        <ListItemText primary={primary} style={{ whiteSpace: 'pre' }} primaryTypographyProps={{fontSize: '11pt'}}  />
                        { expand ? <ExpandMoreIcon /> : <ChevronRightIcon />}
                    </ListItemButton>
                </Tooltip>:undefined}
            <Collapse in={expand} timeout="auto" sx={{background: (specNode.editing)?'aliceblue':undefined}} unmountOnExit>
                <List component="div" disablePadding>
                    {(specNode.type=='list')?
                        Object.keys(specNode.children).map((key)=>{
                            let index = parseInt(key);
                            return <SpecFieldV key={key} index={index} ui={ui} selected={index==selection} select={selectChild} specNode={specNode.children[key]} level={level+1}/>;
                        })
                    :  Object.keys(specNode.children).map((key)=>
                            (<SpecFieldV key={key} index={-1} ui={ui} selected={true} select={()=>{}} specNode={specNode.children[key]} level={level+1}/>))
                    }
                </List>
                <SpecCreator ui={ui} specNode={specNode} level={level}/>
            </Collapse>
            {/*<Collapse in={expanded} timeout="auto" unmountOnExit>*/}
            {/*    {specNode.subNodes.map((value, index, array)=>(<SpecFieldV ui={ui} rootId={rootId} specNode={value}/>))}*/}
            {/*</Collapse>*/}
        </React.Fragment>
    }
}

export default SpecPane;