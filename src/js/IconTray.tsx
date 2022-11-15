import OpenWithIcon from '@mui/icons-material/OpenWith';
import HighlightAltIcon from '@mui/icons-material/HighlightAlt';
import Grid3x3Icon from '@mui/icons-material/Grid3x3';
import * as React from "react";
import {App} from "./graphics";
import {Paper} from "@mui/material";
import {createRoot} from "react-dom/client";
import {createElement} from "react";

class IconTray extends React.Component<{ main: App}, { target: string }> {
    render() {
        return <Paper elevation={3} style={{
            padding: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-around',
            flexWrap: 'wrap',
            background: '#fafafa',
        }}>
            <OpenWithIcon fontSize="small"/>
            <HighlightAltIcon fontSize="small"/>
            <Grid3x3Icon fontSize="small"/>
        </Paper>;
    }
}

class IconPanel {
    div: HTMLDivElement;

    constructor(graphics: App) {
        let div = document.createElement("div");
        div.className = "iconPanel";
        this.div = div;
        let root = createRoot(div);
        let iconTray = createElement(IconTray, {"main":graphics});
        root.render(iconTray);
    }
}

export {IconPanel}