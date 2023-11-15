import {UI} from "../main";
import {Dialog, DialogTitle, DialogContent, FormControl, TextField, Button, DialogActions} from "@mui/material";
import React, {useState} from "react";
import FileView from "./FileView";
import {UFile} from "../server";

export const FileCreator = ({ui, open, setOpen, parentDir, onFileCreate}:
                                 {ui: UI, open:boolean, parentDir:UFile, setOpen:(open:boolean)=>void,onFileCreate:(file:UFile)=>void})=>{
    let [text,setText]=useState<string>();
    return <Dialog open={open} fullWidth maxWidth={'xs'} onClose={()=>setOpen(false)}>
        <DialogTitle>Create file for {parentDir.name}</DialogTitle>
        <DialogContent >
            <FormControl fullWidth>
                <TextField size={'medium'} label="Name of file to be created" variant="standard"
                           value={text} onChange={(e)=>setText(e.target.value)}/>
            </FormControl>
        </DialogContent>
        <DialogActions>
            <Button variant={'contained'} onClick={()=>{
                let file = ui.fs.getFile(parentDir,text,true);
                console.log(file);
                onFileCreate(file);
                setOpen(false);
            }}>
                Confirm
            </Button>
        </DialogActions>
    </Dialog>;
}