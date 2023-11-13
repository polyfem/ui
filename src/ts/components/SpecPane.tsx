import * as React from "react";
import {UI} from "../main";
import {Spec} from "../spec";

import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';

import {
    Box,
    TextField,
    Tooltip,
    TooltipProps,
    IconButton,
    Divider, Button,
} from "@mui/material";
import {ChangeEvent, Fragment, useEffect, useState} from "react";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemText from "@mui/material/ListItemText";
import Collapse from "@mui/material/Collapse";
import {ListItem} from "@mui/material";
import SpecCreator from "./SpecCreator";
import {styled} from "@mui/material/styles";

import EditIcon from '@mui/icons-material/Edit';
import UndoIcon from '@mui/icons-material/Undo';
import RedoIcon from '@mui/icons-material/Redo';
import ColorPicker from "./ColorPicker";
import {FileDialogue} from "./SelectFileDialogue";

const HtmlTooltip = styled(({className, ...props}: TooltipProps) => (
    <Tooltip {...props} classes={{popper: className}}/>
))(({theme}) => ({
    // [`& .${tooltipClasses.tooltip}`]: {
    //     backgroundColor: '#f5f5f9',
    //     color: 'rgba(0, 0, 0, 0.87)',
    //     maxWidth: 220,
    //     fontSize: theme.typography.pxToRem(12),
    //     border: '1px solid #dadde9',
    // },
}));

//Color palette for level indication
const colorRotations = ['crimson', 'forestgreen', 'cornflowerblue', 'sandybrown', 'darkviolet'];
const getColor = (level: number) => colorRotations[(level - 1) % colorRotations.length];

const ActionButtons = (props: {
    editing: boolean,
    setEditing: (editing: boolean) => void,
    finalizeDeletions: () => void,
    cancelDeletions: () => void
}) => {
    return (
        <Box display="flex" flexDirection="row" justifyContent="space-evenly" alignContent="center"
             boxShadow={'0 4px 6px rgba(0, 0, 0, 0.1)'}>

            {(props.editing) ?
                <IconButton size='small' onClick={props.finalizeDeletions}>
                    <CheckIcon color='success'/>
                </IconButton>
                : <IconButton onClick={() => {
                    props.setEditing(true);
                    }}>
                    <EditIcon/>
                </IconButton>
            }
            {(props.editing) ?
                <IconButton>
                    <CloseIcon color='error' onClick={props.cancelDeletions}/>
                </IconButton> : undefined
            }
            <IconButton size='small'>
                <UndoIcon/>
            </IconButton>
            <IconButton size='small'>
                <RedoIcon/>
            </IconButton>
        </Box>
    );
};

class SpecPane extends React.Component<{ ui: UI, rootId: string, specRoot: Spec }, { editing: boolean }> {
    constructor(props: { ui: UI, rootId: string, specRoot: Spec }) {
        super(props);
        this.state = {
            editing: false
        };
    }

    finalizeDeletions() {
        this.props.specRoot.confirmDelete();
        this.props.specRoot.deleting = false;
        this.setState({editing: false});
        this.props.ui.updateSpecPane();
    }

    cancelDeletions() {
        this.props.specRoot.cancelDelete();
        this.props.specRoot.deleting = false;
        this.setState({editing: false});
        this.props.ui.updateSpecPane();
    }

    render() {
        let {ui, rootId, specRoot} = this.props;
        return (specRoot.name == 'none') ?
            <div style={{gridColumn: '1 / span 1', gridRow: '1 / span 2'}}>
                <Box style={{marginLeft: '15pt', marginTop: '15pt', height: '100%', overflow: 'auto'}}>
                    No [Computation Library] Options Selected
                </Box>
            </div> :
            (specRoot.name == undefined) ?
                <div style={{gridColumn: '1 / span 1', gridRow: '1 / span 2'}}>
                    <Box style={{marginLeft: '15pt', marginTop: '15pt', height: '100%', overflow: 'auto'}}>
                        File Does Not Contain Specification
                    </Box>
                </div>
                :
                <Fragment>
                    <div style={{gridColumn: '1 / span 1', gridRow: '1 / span 1'}}>
                        <ActionButtons editing={this.state.editing} setEditing={(editing) => {
                            specRoot.deleting = editing;
                            this.setState({editing: editing});
                            this.props.ui.updateSpecPane();
                        }}
                                       finalizeDeletions={this.finalizeDeletions.bind(this)}
                                       cancelDeletions={this.cancelDeletions.bind(this)}/>
                    </div>
                    <div style={{gridColumn: '1 / span 1', gridRow: '2 / span 1', overflow: 'auto'}}>
                        <List>
                            <SpecFieldV ui={ui} index={-1} specNode={specRoot} level={0} selected={true} select={() => {
                            }}/>
                        </List>
                    </div>
                </Fragment>;
    }
}

//Spec field view
const SpecFieldV = function ({ui, index, specNode, level, selected, select}:
                                 {
                                     ui: UI, index: number, specNode: Spec,
                                     level: number, selected: boolean, select: (key: number) => void
                                 }) {
    let [expanded, setExpanded] = useState(level < 2 || specNode.forceExpansion);
    if (specNode.forceExpansion)
        specNode.forceExpansion = false;
    //For usage with lists
    let [selection, setSelection] = useState(0);
    const handleClick = () => {
        setExpanded(!expanded);
        select(index);
    };
    const selectChild = (index: number) => {
        if (index == selection)//Toggle or select
            setSelection(-1);
        else
            setSelection(index);
    }
    const confirmAdd = () => {
        specNode.forceExpansion = true;
        specNode.setTentative(false);
        ui.updateSpecPane();
        setExpanded(true);
    };
    const cancelAdd = () => {
        specNode.parent.removeChild(specNode);
        ui.updateSpecPane();
    };
    const readyDelete = (event: any) => {
        event.stopPropagation();
        specNode.deleteReady = true;
        ui.updateSpecPane();
    }
    const cancelReadyDelete = (event: any) => {
        event.stopPropagation();
        specNode.deleteReady = false;
        ui.updateSpecPane();
    }
    const [fileSelectOpen, setFileSelectOpen] = useState(false);
    const itemOptions = specNode.tentative ? <span style={{whiteSpace: "nowrap"}}>
                            <IconButton disabled={false} onClick={confirmAdd}>
                                <CheckIcon color='success'/>
                            </IconButton>
                            <IconButton disabled={false}>
                                <CloseIcon color='error' onClick={cancelAdd}/>
                            </IconButton></span>
        : specNode.deleteReady ? <span style={{whiteSpace: "nowrap"}}>
                            <IconButton disabled={false} onClick={cancelReadyDelete}>
                                <CheckIcon color='success'/>
                            </IconButton></span>
            : specNode.deleting ? <span style={{whiteSpace: "nowrap"}}>
                            <IconButton disabled={false} onClick={readyDelete}>
                                <CloseIcon color='error'/>
                            </IconButton></span> : undefined;
    if (specNode.isLeaf) { // Leaf text field rendering
        let [text, setText] = useState(specNode.value);
        let [drawing, setDrawing] = useState(specNode.freeSelector.drawing);
        const onChange = (e: ChangeEvent) => {
            e.preventDefault();
            // @ts-ignore
            if (specNode.type == 'float' && isNaN(e.target.value)) {
                return;
            }
            // @ts-ignore
            specNode.setValue(e.target.value);
        }
        useEffect(() => {
            let valueService = () => {
                setText(specNode.value);
            };
            specNode.subscribeValueService(valueService);
            return () => { //Unsubscribe the service upon component shut down
                specNode.unsubscribeValueService(valueService);
            };
        }, [setText]);
        // console.log(`${specNode.query} value service subscribed`);
        return <ListItem sx={{pl: 2 + level - 1, alignItems: 'baseline', pr: (specNode.deleting) ? 0 : undefined}}
        >
            <Divider orientation="vertical" sx={{mr: 1, borderColor: getColor(level)}} flexItem/>
            <HtmlTooltip title={specNode.doc} arrow>
                <label style={{
                    verticalAlign: 'baseline', marginRight: '6pt', fontSize: '11pt',
                    opacity: (specNode.tentative) ? 0.38 : 1
                }}>
                    {specNode.name}:
                </label>
            </HtmlTooltip>
            {specNode.type=='file'?<Fragment>
                {(specNode.drawable?<Box>
                        <Button size={'small'} variant={'contained'}
                                onClick={()=>{
                                    setFileSelectOpen(!fileSelectOpen);
                                }}>
                            {specNode.value?specNode.value:`Face List`}
                        </Button>
                    <IconButton onClick={()=> {
                        specNode.freeSelector.setDrawing(!drawing);
                        setDrawing(!drawing);
                    }
                    }>
                        {drawing?<CheckIcon/>:<EditIcon/>}
                    </IconButton>
                </Box>:<Button variant={'contained'} size={'small'}
                              color={'success'} onClick={()=>{setFileSelectOpen(!fileSelectOpen)}}>
                {text}
            </Button>)}
                <FileDialogue ui={ui} open={fileSelectOpen} setOpen={setFileSelectOpen}
                              onFileSelect={(file)=>{
                                  if(file.extension!='txt')
                                      return;
                                  specNode.setValue(file.urlFrom(ui.fs.fileRoot));
                                  specNode.freeSelector.openFile(file);
                                  setFileSelectOpen(false);
                              }}/>
            </Fragment>
            :
                <TextField
                    FormHelperTextProps={{style: {textAlign: 'right', color: '#037746'}}}
                    size="small"
                    variant="standard"
                    helperText={specNode.type}
                    disabled={specNode.tentative || specNode.deleteReady}
                    style={{verticalAlign: 'baseline'}} value={text} onChange={onChange}/>}
            {itemOptions}
        </ListItem>;
        // <span style={{display:'flex', flexDirection:'row', alignItems:'baseline'}}>
        // </span>;
    } else { // List header rendering
        //Determine whether self is expanded conditional on if self is an list element or an object element
        let expand = ((index == -1) ? expanded : selected) || specNode.tentative;
        specNode.secondarySelected = expand && !specNode.tentative && !specNode.selected;
        //Give preview text of list items if they are not expanded
        let primary = specNode.name;
        if (index != -1 && !expand) {
            let children = specNode.children;
            let keys = Object.keys(children);
            let enumeration = '';
            for (let i = 0; i < Math.min(keys.length, 2); i++) {
                enumeration += `${keys[i]}: ${children[keys[i]].value}${(i != keys.length - 1) ? ', ' : '...'}`;
            }
            enumeration = enumeration.substring(0, 17);
            primary += `:   ${specNode.type == 'list' ? '[' : '{'}${enumeration}...${specNode.type == 'list' ? ']' : '}'}`
        }
        let colorValues = Object.keys(specNode.colors);
        return <React.Fragment>
            {(level != 0) ?
                //Item text with preview
                <HtmlTooltip
                    placement="right"
                    arrow title={specNode.doc}>
                    <ListItemButton onClick={handleClick}
                                    sx={{
                                        pl: 2 + level - 1,
                                        pr: (specNode.deleting) ? 0 : undefined,
                                        background: (specNode.editing || specNode.secondarySelected) ? 'aliceblue' : ((specNode.selected) ? '#ffd400' : undefined)
                                    }}>
                        <Divider orientation="vertical" sx={{mr: 1, borderColor: getColor(level)}} flexItem/>
                        <ListItemText primary={primary} style={{
                            whiteSpace: 'pre',
                            opacity: (specNode.tentative || specNode.deleteReady) ? 0.38 : 1
                        }} primaryTypographyProps={{fontSize: '11pt'}}/>
                        {colorValues.map((key)=>{
                            return <ColorPicker color={specNode.colors[key]}/>;
                        })}
                        {expand ? <ExpandMoreIcon style={{opacity: (specNode.tentative) ? 0.38 : 1}}/>
                            : <ChevronRightIcon style={{opacity: (specNode.tentative) ? 0.38 : 1}}/>}
                        {itemOptions}
                    </ListItemButton>
                </HtmlTooltip> : undefined}
            <Collapse in={expand} timeout="auto" unmountOnExit>
                <List component="div" disablePadding>
                    {(specNode.type == 'list') ?
                        Object.keys(specNode.children).map((key) => {
                            let index = parseInt(key);
                            return (!specNode.children[key].tentative) ?
                                <SpecFieldV key={specNode.children[key].sid} index={index} ui={ui}
                                            selected={index == selection} select={selectChild}
                                            specNode={specNode.children[key]} level={level + 1}/>
                                : undefined;
                        })
                        : Object.keys(specNode.children).map((key) =>
                            (!specNode.children[key].tentative) ?
                                <SpecFieldV key={specNode.children[key].sid} index={-1} ui={ui} selected={true}
                                            select={() => {
                                            }} specNode={specNode.children[key]} level={level + 1}/>
                                : undefined)
                    }
                </List>
                <SpecCreator key={specNode.sid} ui={ui} specNode={specNode} level={level + 1}
                             color={getColor(level + 1)}/>
                {/*Tentative previews begin here*/}
                <List component="div" disablePadding>
                    {(specNode.type == 'list') ?
                        Object.keys(specNode.children).map((key) => {
                            let index = parseInt(key);
                            return (specNode.children[key].tentative) ?
                                <SpecFieldV key={specNode.children[key].sid} index={index} ui={ui}
                                            selected={index == selection} select={selectChild}
                                            specNode={specNode.children[key]} level={level + 1}/>
                                : undefined;
                        })
                        : Object.keys(specNode.children).map((key) =>
                            (specNode.children[key].tentative) ?
                                (<SpecFieldV key={specNode.children[key].sid} index={-1} ui={ui} selected={true}
                                             select={() => {
                                             }} specNode={specNode.children[key]} level={level + 1}/>)
                                : undefined)
                    }
                </List>
            </Collapse>
            {/*<Collapse in={expanded} timeout="auto" unmountOnExit>*/}
            {/*    {specNode.subNodes.map((value, index, array)=>(<SpecFieldV ui={ui} rootId={rootId} specNode={value}/>))}*/}
            {/*</Collapse>*/}
        </React.Fragment>
    }
}

export default SpecPane;