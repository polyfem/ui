import * as React from "react";
import "prismjs";
import Tabs from '@mui/material/Tabs';
import CodeIcon from '@mui/icons-material/Code';
import Tab from '@mui/material/Tab';
import Box from '@mui/material/Box';
import * as $ from "jquery";
import {FileControl} from "./FileControl";
import {Fab, IconButton} from "@mui/material";
import {Main} from "./main";

interface TabPanelProps {
    children?: React.ReactNode;
    index: number;
    value: number;
    title: string;
    control: FileControl;
}

class TabPanel extends React.Component<TabPanelProps, any> {
    el: HTMLElement;
    $el:any;
    componentDidMount(){
        this.$el = $(this.el);
        this.$el.append(this.props.control.fileDisplay);
        this.el.style.backgroundColor = getComputedStyle(this.props.control.fileDisplay).backgroundColor;
    }
    render(){
        const { children, value, index, ...other } = this.props;

        return (
            <div
                role="tabpanel"
                className="tabFrame"
                hidden={value !== index}
                id={`simple-tabpanel-${index}`}
                aria-labelledby={`simple-tab-${index}`}
                ref = {(el)=>this.el = el}
                {...other}
            >
            </div>
        );
    }
}

class ToggleTabPanel extends TabPanel{
    toggled = false;
    render(){
        const { children, value, index, ...other } = this.props;
        return (
            <div
                role="tabpanel"
                className="tabFrame"
                hidden={value !== index}
                id={`simple-tabpanel-${index}`}
                aria-labelledby={`simple-tab-${index}`}
                ref = {(el)=>this.el = el}
                {...other}
            >
                <div className = 'toggleIcon'>
                    <Fab variant='extended' color='primary' onClick={this.togglePanel.bind(this)} className="toggleIcon" aria-label="code" size="large">
                        <CodeIcon fontSize="medium"/>
                    </Fab>
                </div>
            </div>
        );
    }
    togglePanel(){
        if(!this.toggled){
            this.el.removeChild(this.props.control.fileDisplay);
            this.$el.append(this.props.control.alternativeDisplay);
            this.toggled = true;
        }else{
            this.el.removeChild(this.props.control.alternativeDisplay);
            this.$el.append(this.props.control.fileDisplay);
            this.toggled = false;
        }
    }
}

function a11yProps(index: number) {
    return {
        id: `simple-tab-${index}`,
        'aria-controls': `simple-tabpanel-${index}`,
    };
}

class BasicTabs extends React.Component<{tabNames: string[], tabControls: FileControl[], initialValue: number, main: Main}, {value: number}> {
    moved  = false;
    constructor(props) {
        super(props);
        this.state = {value: props.initialValue};
    }
    componentDidUpdate(prevProps: Readonly<{ tabControls: FileControl[], initialValue: number}>,
                       prevState: Readonly<{ value: number }>, snapshot?: any) {
        this.moved = false;
    }

    render(){
        const {tabNames, tabControls, initialValue} = this.props;
        const handleChange = (event: React.SyntheticEvent, newValue: number) => {
            this.setState({value: newValue});
            this.moved = true;
        };
        let value = (this.moved)?this.state.value:this.props.initialValue;
        this.props.main.setActive(value);
        return (
            <Box id="tabBox" sx={{ width: '100%', height: '100%'}}>
                <Box className="tabBox" sx={{ borderBottom: 1, borderColor: 'divider'}}>
                    <Tabs value={value} onChange={handleChange} aria-label="basic tabs example"
                          variant="scrollable"
                          scrollButtons="auto">
                        {tabNames.map((title, index)=>{
                            return <Tab className="tab" key={index} label={title} {...a11yProps(index)} />;
                        })};
                    </Tabs>
                </Box>
                {this.props.tabNames.map((title, index)=>{
                    if(!tabControls[index].togglePane){
                        return <TabPanel value={value} title={title} key ={index} index={index} control ={tabControls[index]}/>;
                    }
                    else return <ToggleTabPanel value={value} title={title} key ={index} index={index} control ={tabControls[index]}/>;
                }
                )}
            </Box>
        );
    }
}

//@ts-ignore
Prism.manual = true;
// //@ts-ignore
// Prism.hooks.add('before-sanity-check', function (env) {
//     env.element.innerHTML = env.element.innerHTML.replace(/<br>/g, '\n');
//     console.log(env.element.innerHTML);
//     env.code = env.element.textContent;
// });
class CodePanel extends React.Component<{language: string, readonly: boolean, code:string}, {code: string}>{
    constructor(props) {
        super(props);
        this.state = {
            code: props.code
        };
        this.handleChange = this.handleChange.bind(this);
    }
    componentDidUpdate() {

        //@ts-ignore
        Prism.hooks.add("before-highlight", function (env) {
            env.code = env.element.innerText;
        });
        //@ts-ignore
        Prism.highlightAll();
    }
    componentDidMount() {
        //@ts-ignore
        Prism.highlightAll();
    }
    handleChange(event){
        if(!this.props.readonly){
            console.log(event);
            //@ts-ignore
            // Prism.highlightAll();
        }
    }
    render(){
        return (
            <pre style={{margin: '0'}}>
                    <code contentEditable={true} onInput={this.handleChange}
                          className={`language-${this.props.language}`}>{this.props.code}</code>
                </pre>
        );
    }
}

export {CodePanel, BasicTabs}