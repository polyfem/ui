import {UI} from "../main";
import {Dialog, DialogTitle, DialogContent} from "@mui/material";
import React from "react";
import FileView from "./FileView";
import {UFile} from "../server";

export const FileDialogue = ({ui, open, setOpen, onFileSelect}:
     {ui: UI, open:boolean, setOpen:(open:boolean)=>void,onFileSelect:(file:UFile)=>void})=>{
    return <Dialog open={open} onClose={()=>setOpen(false)}>
        <DialogTitle>Select File</DialogTitle>
        <DialogContent>
            <FileView ui={ui} onFileSelect={onFileSelect}/>
        </DialogContent>
    </Dialog>;
}