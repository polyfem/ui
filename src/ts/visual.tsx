import UI from "./main";
import * as React from "react";
import {ToolKit} from "./components/ToolKit";
import NavBar from "./components/NavBar";
import Box from '@mui/material/Box';
import Drawer from '@mui/material/Drawer';
import CssBaseline from '@mui/material/CssBaseline';
import Toolbar from '@mui/material/Toolbar';
import List from '@mui/material/List';
import Divider from '@mui/material/Divider';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import InboxIcon from '@mui/icons-material/MoveToInbox';
import MailIcon from '@mui/icons-material/Mail';
import AppBar from "@mui/material/AppBar";
import EditorPane from "./components/EditorPane";

const drawerWidth = 300;

class Visual extends React.Component<{ui: UI, rootId: string}, {open:boolean}>{
    constructor(props:{ui: UI, rootId: string}){
        super(props);
        this.state = {open:true};
    }
    render(){
        return <Box sx={{ display: 'grid' }}
                    style={{gridTemplateColumns: `${drawerWidth}px 1fr`,
                            gridTemplateRows: `64px 1fr`,
                            height: '100%'}}>
            <CssBaseline />
            <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}
                    style={{gridColumn: '1 / span 2',
                        gridRow: '1 / span 1'}}>
                <NavBar/>
            </AppBar>
            <Drawer
                variant="permanent"
                sx={{
                    width: drawerWidth,
                    flexShrink: 0,
                    [`& .MuiDrawer-paper`]: { width: drawerWidth, boxSizing: 'border-box' },
                }}
                style={{gridColumn: '1 / span 1',
                gridRow: '2 / span 1'}}
            >
                <Toolbar />
                <Box>
                    <ToolKit{...this.props}/>
                    <Divider />
                    <List  sx={{ overflow: 'auto' }}>
                        {['All mail', 'Trash', 'Spam'].map((text, index) => (
                            <ListItem key={text} disablePadding>
                                <ListItemButton>
                                    <ListItemIcon>
                                        {index % 2 === 0 ? <InboxIcon /> : <MailIcon />}
                                    </ListItemIcon>
                                    <ListItemText primary={text} />
                                </ListItemButton>
                            </ListItem>
                        ))}
                    </List>
                </Box>
            </Drawer>
            <Box sx={{ flexGrow: 1, p: 3 }}
                 style={{gridColumn: '2 / span 1',
                     gridRow: '2 / span 1'}}>
                <EditorPane {...this.props}/>
            </Box>
        </Box>;
    }
}

export{Visual};