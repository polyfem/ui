import * as React from "react";
import {UI} from "../main";
import {Spec, RawSpecTree} from "../spec";

import Divider from "@mui/material/Divider";
import Chip from "@mui/material/Chip";
import MenuItem from '@mui/material/MenuItem';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import Menu from '@mui/material/Menu';
import {useRef} from "react";
import IconButton from "@mui/material/IconButton";
import {Tooltip} from "@mui/material";

const SpecCreator = function({ui, specNode, level, color}:
                                 {ui: UI, specNode: Spec, level: number, color: string}){
    let anchorEl=useRef(null);
    let [open, setOpen] = React.useState(false);
    let divider = <Divider textAlign="left" sx={{pl:2+level-1, pb:0.5, pt:0.5,  "&::before, &::after": {
            borderColor: color,
        }}}>
        <Chip label="Add" variant="outlined" disabled={specNode.tentative} onClick={()=>{setOpen(!open)}}  ref={anchorEl}/>
    </Divider>;
    let childTypeSpecs = ui.specEngine.getChildTypes(specNode);
    let childTypes: string[] = Object.keys(childTypeSpecs);
    const addTentativeChild = function(childName: string, typeOverride=-1){
        let childSpec = new Spec(childName, specNode);
        let query = specNode.query+'/'+childName;
        childSpec = ui.specEngine.validate(query,childSpec, specNode, typeOverride);
        childSpec.setTentative(true);
        specNode.pushChild(childSpec);
        ui.updateSpecPane();
    }
    let omitted = true;
    //Omitted if all entries are fulfilled, and no wild cards found
    for(let option of childTypes)
        omitted&&=specNode.findChild(option)!=undefined&&option!='*';
    return<React.Fragment>
        {(!omitted)?
            divider:undefined}
        <Menu
            id="lock-menu"
            anchorEl={anchorEl.current}
            open={open}
            onClose={()=>{setOpen(false)}}
            anchorOrigin={{
                vertical: 'top',
                horizontal: 'right',
            }}
            sx={{m:1}}
            MenuListProps={{
                role: 'listbox',
                style:{width:'150pt'}
            }}
        >
            {childTypes.map((childType, index) => {
                let childTypeTree = childTypeSpecs[childType];
                let typeOverloaded = childTypeTree.rawSpec.length!=1;
                let docString = (!typeOverloaded)?childTypeSpecs[childType].rawSpec[0].doc:'';
                let [typesOpen, setTypesOpen] = React.useState(false);
                const typeAnchorEl = useRef(null);
                const handleInfoClick = function(event:any){
                    event.stopPropagation();
                };
                return (
                (!specNode.findChild(childType))?
                <MenuItem
                    style={{display:'flex'}}
                    key={childType}
                    onClick={(typeOverloaded)?(event)=>{
                            setTypesOpen(!typesOpen);
                        }
                        :(event) => {
                        addTentativeChild(childType);
                        setOpen(false);
                    }}
                    ref={typeAnchorEl}
                >
                    {(childType=='*')?specNode.name:childType}
                    <Tooltip placement="right"
                             arrow title={docString}>
                        <IconButton aria-label="fingerprint" color="info"
                                    style={{position:'absolute', 'right': '5pt'}} onClick={handleInfoClick}>
                            {(typeOverloaded)?
                                <ChevronRightIcon fontSize='small'/>
                                :<InfoOutlinedIcon fontSize='small'/>
                            }
                        </IconButton>
                    </Tooltip>
                    {(typesOpen)?
                        <TypeSelector
                            addTentativeChild={(type)=>{
                                addTentativeChild(childType, type);
                                setOpen(false);}
                            }
                            childTypeTree={childTypeTree} ui={ui} parentEl={typeAnchorEl.current}/>
                        :undefined
                    }
                </MenuItem>
                    :undefined
            );})}
        </Menu>
    </React.Fragment>;
}

const TypeSelector = function({ui, childTypeTree, parentEl, addTentativeChild}:
                                  {ui: UI, childTypeTree: RawSpecTree, parentEl: HTMLElement,
                                      addTentativeChild: (typeOverride: number)=>void}){
    let [open, setOpen] = React.useState(true);
    return <Menu
            id="lock-menu"
            anchorEl={parentEl}
            open={open}
            onClose={()=>{setOpen(false)}}
            anchorOrigin={{
                vertical: 'top',
                horizontal: 'right',
            }}
            sx={{m:1}}
            MenuListProps={{
                role: 'listbox',
                style:{width:'150pt'}
            }}
        >
        {childTypeTree.rawSpec.map((rawSpec, index) => {
            let docString = rawSpec.doc;
            const handleInfoClick = function(event:any){
                event.stopPropagation();
            };
            return (
                    <MenuItem
                        style={{display:'flex'}}
                        key={index}
                        onClick={(event) => {
                            addTentativeChild(index);
                            setOpen(false);
                        }}
                    >
                        {(rawSpec.type_name)?rawSpec.type_name:`type: ${rawSpec.type}`}
                        <Tooltip placement="right"
                                 arrow title={docString}>
                            <IconButton aria-label="fingerprint" color="info"
                                        style={{position:'absolute', 'right': '5pt'}} onClick={handleInfoClick}>
                                <InfoOutlinedIcon fontSize='small'/>
                            </IconButton>
                        </Tooltip>
                    </MenuItem>);})}
        </Menu>;
}

export default SpecCreator;