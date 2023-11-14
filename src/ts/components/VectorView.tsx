import {Spec} from "../spec";
import {SmartField} from "./SmartField";
import {Box} from "@mui/material";
import * as React from "react";
import IconButton from "@mui/material/IconButton";
import AddIcon from "@mui/icons-material/Add";
import {UI} from "../main";

export const VectorView = ({specNode, ui}:{specNode:Spec,ui:UI})=>{
    return <Box style={{whiteSpace:'nowrap', display:'flex', justifyContent:'center', alignItems:'center', width:'100%'}}>
        (
        {Object.keys(specNode.children).map((key,index)=>{
                let child = specNode.children[key];
                return <SmartField specNode={child} ui={ui} compactEntry isFirst={index==0}/>
            }
        )})

        <IconButton size={'small'} style={{justifySelf:'right'}} onClick={(e)=>{
            e.stopPropagation();
            e.preventDefault();
            let child = new Spec('*',specNode);
            child = ui.specEngine.validate(`${specNode.query}/*`,child,specNode);
            specNode.pushChild(child);
            ui.updateSpecPane();
        }}>
            <AddIcon>
            </AddIcon>
        </IconButton>
    </Box>;
}