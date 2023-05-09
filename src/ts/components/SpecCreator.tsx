import * as React from "react";
import {UI} from "../main";
import {Spec, RawSpecTree} from "../spec";

import Divider from "@mui/material/Divider";
import Chip from "@mui/material/Chip";
import MenuItem from '@mui/material/MenuItem';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import Menu from '@mui/material/Menu';
import {useRef} from "react";
import IconButton from "@mui/material/IconButton";
import {Tooltip} from "@mui/material";

const SpecCreator = function({ui, specNode, level}:
                                 {ui: UI, specNode: Spec, level: number}){
    let anchorEl=useRef(null);
    let [open, setOpen] = React.useState(false);
    let divider = <Divider textAlign="left" sx={{pl:2+level-1, pb:0.5, pt:0.5}}>
        <Chip label="Add" variant="outlined" disabled={specNode.tentative} onClick={()=>{setOpen(!open)}}  ref={anchorEl}/>
    </Divider>;
    let childTypeSpecs = ui.specEngine.getChildTypes(specNode);
    let childTypes: string[] = Object.keys(childTypeSpecs);
    const addTentativeChild = function(childName: string){
        let childSpec = new Spec(childName, specNode);
        let query = specNode.query+'/'+childName;
        childSpec = ui.specEngine.validate(query,childSpec, specNode);
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
            {childTypes.map((option, index) => {
                let docString = (childTypeSpecs[option].rawSpec[0])?childTypeSpecs[option].rawSpec[0].doc:'';
                const handleInfoClick = function(event:any){
                    event.stopPropagation();
                };
                return (
                (!specNode.findChild(option))?
                <MenuItem
                    style={{display:'flex'}}
                    key={option}
                    onClick={(event) => {
                        addTentativeChild(option);
                        setOpen(false);
                    }}
                >
                    {option}
                    <Tooltip placement="right"
                             arrow title={docString}>
                        <IconButton aria-label="fingerprint" color="info"
                                    style={{position:'absolute', 'right': '5pt'}} onClick={handleInfoClick}>
                            <InfoOutlinedIcon fontSize='small'/>
                        </IconButton>
                    </Tooltip>
                </MenuItem>
                    :undefined
            );})}
        </Menu>
    </React.Fragment>;
}

export default SpecCreator;