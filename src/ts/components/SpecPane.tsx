import * as React from "react";
import {UI} from "../main";
import {Spec} from "../spec";

import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';

import {Box, TextField, Tooltip, tooltipClasses, TooltipProps, Typography, IconButton, Divider} from "@mui/material";
import {ChangeEvent, useState} from "react";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemText from "@mui/material/ListItemText";
import Collapse from "@mui/material/Collapse";
import {ListItem} from "@mui/material";
import SpecCreator from "./SpecCreator";
import {styled} from "@mui/material/styles";

const HtmlTooltip = styled(({ className, ...props }: TooltipProps) => (
    <Tooltip {...props} classes={{ popper: className }} />
))(({ theme }) => ({
    // [`& .${tooltipClasses.tooltip}`]: {
    //     backgroundColor: '#f5f5f9',
    //     color: 'rgba(0, 0, 0, 0.87)',
    //     maxWidth: 220,
    //     fontSize: theme.typography.pxToRem(12),
    //     border: '1px solid #dadde9',
    // },
}));

//Color palette for level indication
const colorRotations = ['crimson','forestgreen','cornflowerblue','sandybrown','darkviolet'];
const getColor = (level:number)=>colorRotations[(level-1)%colorRotations.length];

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
    let [expanded, setExpanded] = useState(level<2||specNode.forceExpansion);
    if(specNode.forceExpansion)
        specNode.forceExpansion=false;
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
    const confirmAdd = ()=>{
        specNode.forceExpansion=true;
        specNode.setTentative(false);
        ui.updateSpecPane();
        setExpanded(true);
    };
    const cancelAdd = ()=>{specNode.parent.removeChild(specNode);
        ui.updateSpecPane();
    };
    if(specNode.isLeaf){
        let [text, setText] = useState(specNode.value)
        specNode.subscribeValueService(()=>{setText(specNode.value);});
        console.log(`${specNode} value service subscribed`);
        const onChange = (e: ChangeEvent)=>{
            // @ts-ignore
            specNode.setValue(e.target.value);
        }
        return <ListItem sx={{ pl: 2+level-1, alignItems:'baseline'}}
                         >
            <Divider orientation="vertical" sx={{mr:1, borderColor:getColor(level)}} flexItem />
            <HtmlTooltip title={specNode.doc} arrow>
                <label style={{verticalAlign: 'baseline', marginRight: '6pt', fontSize: '11pt',
                            opacity:(specNode.tentative)?0.38:1}}>
                    {specNode.name}:
                </label>
            </HtmlTooltip>
            <TextField
                FormHelperTextProps={{style:{textAlign: 'right', color: '#037746'}}}
                size="small"
                variant="standard"
                helperText={specNode.type}
                disabled={specNode.tentative}
                style={{verticalAlign: 'baseline'}} value={text} onChange={onChange}/>
            {specNode.tentative ? <span style={{whiteSpace: "nowrap"}}>
                            <IconButton disabled={false}  onClick={confirmAdd}>
                                <CheckIcon color='success'/>
                            </IconButton>
                            <IconButton disabled={false}>
                                <CloseIcon color='error' onClick={cancelAdd}/>
                            </IconButton></span>
            :undefined}
        </ListItem>;
        // <span style={{display:'flex', flexDirection:'row', alignItems:'baseline'}}>
        // </span>;
    }else{
        //Determine whether self is expanded conditional on if self is an list element or an object element
        let expand = ((index==-1)?expanded:selected)||specNode.tentative;
        //Give preview text of list items if they are not expanded
        let primary = specNode.name;
        if(index!=-1&&!expand){
            let children = specNode.children;
            let keys = Object.keys(children);
            let enumeration = '';
            for(let i = 0; i<Math.min(keys.length, 2); i++){
                enumeration+=`${keys[i]}: ${children[keys[i]].value}${(i!=keys.length-1)?', ':'...'}`;
            }
            enumeration = enumeration.substring(0,17);
            primary += `:   ${specNode.type=='list'? '[':'{'}${enumeration}...${specNode.type=='list'? ']':'}'}`
        }
        return <React.Fragment>
            {(level!=0)?
                //Item text with preview
                <HtmlTooltip
                    placement="right"
                    arrow title={specNode.doc} >
                    <ListItemButton onClick={handleClick}
                                    sx={{ pl: 2+level-1,
                                        background:(specNode.editing||specNode.secondarySelected)?'aliceblue':((specNode.selected)?'#ffd400':undefined)}}>
                        <Divider orientation="vertical" sx={{mr:1, borderColor:getColor(level)}} flexItem />
                        <ListItemText primary={primary} style={{ whiteSpace: 'pre',
                            opacity:(specNode.tentative)?0.38:1}} primaryTypographyProps={{fontSize: '11pt'}}/>
                        { expand ? <ExpandMoreIcon style={{opacity:(specNode.tentative)?0.38:1}}/>
                            : <ChevronRightIcon style={{opacity:(specNode.tentative)?0.38:1}}/>}
                        {specNode.tentative ? <span style={{whiteSpace: "nowrap"}}>
                            <IconButton disabled={false} onClick={confirmAdd}>
                                <CheckIcon color='success'/>
                            </IconButton>
                            <IconButton disabled={false} onClick={cancelAdd}>
                                <CloseIcon color='error'/>
                            </IconButton></span>:undefined}
                    </ListItemButton>
                </HtmlTooltip>:undefined}
            <Collapse in={expand} timeout="auto" sx={{background: (specNode.editing)?'aliceblue':undefined}} unmountOnExit>
                <List component="div" disablePadding>
                    {(specNode.type=='list')?
                        Object.keys(specNode.children).map((key)=>{
                            let index = parseInt(key);
                            return (!specNode.children[key].tentative)?
                                <SpecFieldV key={specNode.children[key].query} index={index} ui={ui} selected={index==selection} select={selectChild} specNode={specNode.children[key]} level={level+1}/>
                                :undefined;
                        })
                    :  Object.keys(specNode.children).map((key)=>
                            (!specNode.children[key].tentative)?
                                <SpecFieldV key={specNode.children[key].query} index={-1} ui={ui} selected={true} select={()=>{}} specNode={specNode.children[key]} level={level+1}/>
                                :undefined)
                    }
                </List>
                <SpecCreator ui={ui} key={specNode.pointer} specNode={specNode} level={level+1} color={getColor(level+1)}/>
                {/*Tentative previews begin here*/}
                <List component="div" disablePadding>
                    {(specNode.type=='list')?
                        Object.keys(specNode.children).map((key)=>{
                            let index = parseInt(key);
                            return (specNode.children[key].tentative)?
                                <SpecFieldV key={specNode.children[key].query} index={index} ui={ui} selected={index==selection} select={selectChild} specNode={specNode.children[key]} level={level+1}/>
                                :undefined;
                        })
                        :  Object.keys(specNode.children).map((key)=>
                            (specNode.children[key].tentative)?
                            (<SpecFieldV key={specNode.children[key].query} index={-1} ui={ui} selected={true} select={()=>{}} specNode={specNode.children[key]} level={level+1}/>)
                            :undefined)
                    }
                </List>
            </Collapse>
            {/*<Collapse in={expanded} timeout="auto" unmountOnExit>*/}
            {/*    {specNode.subNodes.map((value, index, array)=>(<SpecFieldV ui={ui} rootId={rootId} specNode={value}/>))}*/}
            {/*</Collapse>*/}
        </React.Fragment>
    }
}

export default SpecPane;