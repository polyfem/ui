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

const SpecCreator = function({ui, specNode, level}:
                                 {ui: UI, specNode: Spec, level: number}){
    let anchorEl=useRef(null);
    let [open, setOpen] = React.useState(false);
    let divider = <Divider textAlign="left" sx={{pl:2+level-1, pb:1}}>
        <Chip label="Add" variant="outlined" onClick={()=>{setOpen(!open)}}  ref={anchorEl}/>
    </Divider>;
    let childTypes: { [key: string]: RawSpecTree} = ui.specEngine.getChildTypes(specNode);
    return<React.Fragment>
        {divider}
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
            {Object.keys(childTypes).map((option, index) => (
                (!specNode.findChild(option))?
                <MenuItem
                    style={{display:'flex'}}
                    key={option}
                    onClick={(event) => {}}
                >
                    {option}
                    <IconButton aria-label="fingerprint" color="info"
                                style={{position:'absolute', 'right': '5pt'}}>
                        <InfoOutlinedIcon fontSize='small'/>
                    </IconButton>
                </MenuItem>
                    :undefined
            ))}
        </Menu>
    </React.Fragment>;
}

export default SpecCreator;