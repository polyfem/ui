import * as React from 'react';
import TreeView from '@mui/lab/TreeView';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import TreeItem from '@mui/lab/TreeItem';
import {Box} from "@mui/material";
import {UI} from "../main";
import {UFile} from "../server";
import {SyntheticEvent} from "react";

function FolderView({ui, rootId, file}: {ui: UI, rootId: string, file: UFile}){
    const handleClick=(e: SyntheticEvent)=>{
        if(!file.isDir){
            ui.openFile(file);
        }
    }
    // const onChange
    return <TreeItem nodeId={file.url} label={file.name} onSelect={handleClick}>
            {(file.isDir&&file.ls())?
                file.children.map((ch)=>(<FolderView ui={ui} rootId={rootId} file={ch}/>))
                :undefined}
        </TreeItem>;
}

export default function FileView({ui, rootId}: {ui: UI, rootId: string}) {
    return (
        <Box style={{marginLeft: '5pt', marginTop:'5pt', marginBottom:'0', height: '45%', overflowY: 'auto' }}>
            <TreeView
                aria-label="file system navigator"
                defaultCollapseIcon={<ExpandMoreIcon />}
                defaultExpandIcon={<ChevronRightIcon />}
                sx={{ flexGrow: 1, maxWidth: 400, height: '40%'}}
            >
                <FolderView ui={ui} rootId={rootId} file={ui.fs.fileRoot}/>
            </TreeView>
        </Box>
    );
}