import * as React from 'react';
import TreeView from '@mui/lab/TreeView';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import TreeItem from '@mui/lab/TreeItem';
import {Box} from "@mui/material";
import {UI} from "../main";
import {UFile} from "../server";

function FolderView({ui, rootId, file}: {ui: UI, rootId: string, file: UFile}){
    return <TreeItem nodeId={file.url} label={file.name}>
            {(file.isDir&&file.ls())?
                file.children.map((ch)=>(<FolderView ui={ui} rootId={rootId} file={ch}/>))
                :undefined}
        </TreeItem>;
}

export default function FileView({ui, rootId}: {ui: UI, rootId: string}) {
    return (
        <Box style={{marginLeft: '5pt', marginTop:'5pt'}}>
            <TreeView
                aria-label="file system navigator"
                defaultCollapseIcon={<ExpandMoreIcon />}
                defaultExpandIcon={<ChevronRightIcon />}
                sx={{ height: '40%', flexGrow: 1, maxWidth: 400, overflowY: 'auto' }}
            >
                <FolderView ui={ui} rootId={rootId} file={ui.fs.fileRoot}/>
            </TreeView>
        </Box>
    );
}