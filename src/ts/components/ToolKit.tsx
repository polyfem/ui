import UI from "../main";
import * as React from "react";
import List from "@mui/material/List";
import ListSubheader from "@mui/material/ListSubheader";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import HexagonIcon from "@mui/icons-material/Hexagon";
import ListItemText from "@mui/material/ListItemText";
import BlurOnIcon from "@mui/icons-material/BlurOn";
import FunctionsIcon from "@mui/icons-material/Functions";
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import Collapse from "@mui/material/Collapse";
import StarBorder from "@mui/icons-material/StarBorder";
import BorderStyleIcon from "@mui/icons-material/BorderStyle";
import WebhookTwoToneIcon from "@mui/icons-material/WebhookTwoTone";
import OutputIcon from "@mui/icons-material/Output";

class ToolKit extends React.Component<{ui: UI, rootId: string}, {open: boolean}>{
    constructor(props:{ui: UI, rootId: string}){
        super(props);
        this.state = {open:false};
        this.handleClick = this.handleClick.bind(this);
    }
    handleClick () {
        console.log("handling");
        this.setState((state)=>({open:!state.open}));
        console.log(this.state);
    };
    render(){
        return (<List
            sx={{ width: '100%', maxWidth: 360, bgcolor: 'background.paper' }}
            component="nav"
            aria-labelledby="nested-list-subheader"
            subheader={
                <ListSubheader component="div" id="nested-list-subheader">
                    [Computation Library] Options
                </ListSubheader>
            }
        >
            <ListItemButton>
                <ListItemIcon>
                    <HexagonIcon />
                </ListItemIcon>
                <ListItemText primary="Geometry" />
                { this.state.open ? <ChevronLeftIcon /> : <ChevronRightIcon />}
            </ListItemButton>
            <ListItemButton>
                <ListItemIcon>
                    <BlurOnIcon />
                </ListItemIcon>
                <ListItemText primary="Space" />
                { this.state.open ? <ChevronLeftIcon /> : <ChevronRightIcon />}
            </ListItemButton>
            <ListItemButton onClick={this.handleClick}>
                <ListItemIcon>
                    <FunctionsIcon />
                </ListItemIcon>
                <ListItemText primary="Solver" />
                { this.state.open ? <ChevronLeftIcon /> : <ChevronRightIcon />}
            </ListItemButton>
            <Collapse in={ this.state.open} timeout="auto" unmountOnExit>
                <List component="div" disablePadding>
                    <ListItemButton sx={{ pl: 4 }}>
                        <ListItemIcon>
                            <StarBorder />
                        </ListItemIcon>
                        <ListItemText primary="" />
                        { this.state.open ? <ChevronLeftIcon /> : <ChevronRightIcon />}
                    </ListItemButton>
                </List>
            </Collapse>
            <ListItemButton onClick={this.handleClick}>
                <ListItemIcon>
                    <BorderStyleIcon />
                </ListItemIcon>
                <ListItemText primary="Boundary Conditions" />
                { this.state.open ? <ChevronLeftIcon /> : <ChevronRightIcon />}
            </ListItemButton>
            <ListItemButton onClick={this.handleClick}>
                <ListItemIcon>
                    <WebhookTwoToneIcon />
                </ListItemIcon>
                <ListItemText primary="Materials" />
                { this.state.open ? <ChevronLeftIcon /> : <ChevronRightIcon />}
            </ListItemButton>
            <ListItemButton onClick={this.handleClick}>
                <ListItemIcon>
                    <OutputIcon />
                </ListItemIcon>
                <ListItemText primary="Output" />
                { this.state.open ? <ChevronLeftIcon /> : <ChevronRightIcon />}
            </ListItemButton>
        </List>
    );
    }
}

export {ToolKit};