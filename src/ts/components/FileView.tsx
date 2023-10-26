import * as React from 'react';
import TreeView from '@mui/lab/TreeView';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import TreeItem from '@mui/lab/TreeItem';
import {Box} from "@mui/material";
import {UI} from "../main";
import {UFile} from "../server";
import {SyntheticEvent, useState} from "react";
import MenuItem from "@mui/material/MenuItem";
import Menu from "@mui/material/Menu";
import ListItemIcon from "@mui/material/ListItemIcon";
import DoubleArrow from "@mui/icons-material/DoubleArrow";
import ListItemText from "@mui/material/ListItemText";
import ContentCopy from "@mui/icons-material/ContentCopy";

function FolderView({ui, rootId, file}: {ui: UI, rootId: string, file: UFile}){
    const [menuOpen, setMenuOpen] = useState(false);
    const [anchorEl, setAnchorEl] = useState<HTMLElement>();
    const handleClick=(e: SyntheticEvent)=>{
        if(!file.isDir){
            console.log("clicked!");
            ui.openFile(file);
        }
    }
    // const onChange
    return <React.Fragment>
        <TreeItem nodeId={file.url} label={file.name} onClick={handleClick}
                     ref={(el:HTMLElement)=>{
                         if(el!=null)
                             //@ts-ignore
                            setAnchorEl(el);
                     }}
                     onContextMenu={(e)=>{
                         e.preventDefault();
                         e.stopPropagation();
                         setMenuOpen(true);
                     }}>
            {(file.isDir&&file.ls())?
                file.children.map((ch)=>(<FolderView ui={ui} key={ch.url} rootId={rootId} file={ch}/>))
                :undefined}
        </TreeItem>
        <Menu
            id="basic-menu"
            anchorEl={anchorEl}
            open={menuOpen}
            onClose={()=>setMenuOpen(false)}
            MenuListProps={{
                'aria-labelledby': 'basic-button',
            }}
            anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'center',
            }}
            transformOrigin={{
                vertical: 'top',
                horizontal: 'left',
            }}
        >
            <MenuItem onClick={()=>{
                ui.addGeometryToSpec(file);}}>
                <ListItemIcon>
                    <DoubleArrow fontSize="small" />
                </ListItemIcon>
                <ListItemText>Insert</ListItemText>
            </MenuItem>
            <MenuItem onClick={()=>{
            }}>
                <ListItemIcon>
                    <ContentCopy fontSize="small" />
                </ListItemIcon>
                <ListItemText>Duplicate</ListItemText>
            </MenuItem>
        </Menu></React.Fragment>;
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