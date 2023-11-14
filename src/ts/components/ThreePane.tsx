//For hosting a graphics panel
import React, { useState, useEffect } from 'react';
import {UI} from "../main";
import {FileControl, GFileControl} from "../fileControl";
import {Canvas, CanvasController} from "../graphics";
import IconButton from "@mui/material/IconButton";
import {FormControl, Stack} from "@mui/material";
import DrawPlatte from "./DrawPlatte";

export default function ThreePane({ui,rootId, fileControl}: {ui: UI, rootId: string, fileControl: GFileControl}){
    const hostId = `graphics-${fileControl.id}`;
    const loadGraphics = ()=>{
        if(fileControl.canvasController==undefined){
            fileControl.loadFile();
        }else{
            fileControl.canvasController.setNewHost(document.getElementById(hostId));
        }
    }
    useEffect(loadGraphics);
    const [drawPlatteOpen, setDrawPlatteOpen] = useState(false);
    const [rid, setRid] = useState('');
    fileControl.setDrawPlatte = setDrawPlatteOpen;
    fileControl.setRid = setRid;
    return <div id={hostId} style={{width: '100%', height:'95%', position:'relative', overflow:'hidden'}}>
        <DrawPlatte ui={ui} rootId={rootId} fileControl={fileControl} rid={rid} drawPlatteOpen={drawPlatteOpen}/>
    </div>
}