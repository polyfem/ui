import * as React from 'react';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import AddIcon from '@mui/icons-material/Add';
import ReplayIcon from '@mui/icons-material/Replay';
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
import IconButton from "@mui/material/IconButton";
import {TreeItem, TreeView} from "@mui/x-tree-view";

function FolderView({ui, file, onFileSelect}: {ui: UI, file: UFile, onFileSelect:(file:UFile)=>void}){
    const [menuOpen, setMenuOpen] = useState(false);
    const [anchorEl, setAnchorEl] = useState<HTMLElement>();
    // const onChange
    return <React.Fragment>
        {(file.isDir)?
            <TreeItem nodeId={file.url} label={file.name} onClick={()=>onFileSelect(file)}
                      ref={(el:HTMLElement)=>{
                          if(el!=null)
                              //@ts-ignore
                              setAnchorEl(el);
                      }}
                      expandIcon={(file.isDir)?<ExpandMoreIcon />:undefined}
                      onContextMenu={(e)=>{
                          e.preventDefault();
                          e.stopPropagation();
                          setMenuOpen(true);
                      }}>
                {(file.isDir&&file.ls())?
                    file.children.map((ch)=>(<FolderView ui={ui} key={ch.url} file={ch} onFileSelect={onFileSelect}/>))
                    :undefined}
                <Box style={{justifyContent:'center', display:"flex"}}  onClick={()=>{
                    ui.openFileCreator(file);
                }}>
                    <IconButton size={'small'}>
                        <AddIcon fontSize={'small'}/>
                    </IconButton>
                </Box>
            </TreeItem>
        :  <TreeItem nodeId={file.url} label={file.name} onClick={()=>onFileSelect(file)}
                     ref={(el:HTMLElement)=>{
                         if(el!=null)
                             //@ts-ignore
                             setAnchorEl(el);
                     }}
                     expandIcon={(file.isDir)?<ExpandMoreIcon />:undefined}
                     onContextMenu={(e)=>{
                         e.preventDefault();
                         e.stopPropagation();
                         setMenuOpen(true);
                     }}/>}
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

export default function FileView({ui, onFileSelect}: {ui: UI, onFileSelect:(file:UFile)=>void}) {
    return (
        <Box style={{marginLeft: '5pt', marginTop:'5pt', marginBottom:'0', height: '100%', overflowY: 'auto' }}>
            <TreeView defaultExpanded={[ui.fs.fileRoot.url]}
                aria-label="file system navigator"
                defaultCollapseIcon={<ExpandMoreIcon />}
                defaultExpandIcon={<ChevronRightIcon />}
                sx={{ flexGrow: 1, maxWidth: 400, height: '40%'}}
            >
                <FolderView ui={ui} file={ui.fs.fileRoot} onFileSelect={onFileSelect}/>
            </TreeView>
        </Box>
    );
}