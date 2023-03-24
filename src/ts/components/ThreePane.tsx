//For hosting a graphics panel
import React, { useState, useEffect } from 'react';
import {UI} from "../main";
import {FileControl, GFileControl} from "../fileControl";
import {instantiate} from "../graphics";

export default function ThreePane({ui,rootId, fileControl}: {ui: UI, rootId: string, fileControl: GFileControl}){
    const hostId = `graphics-${fileControl.id}`;
    const loadGraphics = ()=>{
        if(fileControl.canvas==undefined){
            fileControl.canvas = instantiate(hostId);
        }else{
            fileControl.canvas.setNewHost(document.getElementById(hostId));
        }
    }
    useEffect(loadGraphics);
    return <div id={hostId} style={{width: '100%', height:'100%'}}/>
}