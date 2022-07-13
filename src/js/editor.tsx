import * as React from "react";
import "prismjs";
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import * as $ from "jquery";
import {useEffect} from "react";

interface TabPanelProps {
    children?: React.ReactNode;
    index: number;
    value: number;
    content: HTMLElement;
}

class TabPanel extends React.Component<TabPanelProps, any> {
    el: HTMLElement;
    $el:any;
    componentDidMount(){
        this.$el = $(this.el);
        this.$el.append(this.props.content);
        this.el.style.backgroundColor = getComputedStyle(this.props.content).backgroundColor;
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
            />
        );
    }
}

function a11yProps(index: number) {
    return {
        id: `simple-tab-${index}`,
        'aria-controls': `simple-tabpanel-${index}`,
    };
}

class BasicTabs extends React.Component<{tabTitles: string[], initialValue: number, tabContents: HTMLElement[]}, {value: number}> {
    moved  = false;
    constructor(props) {
        super(props);
        this.state = {value: props.initialValue};
    }
    componentDidUpdate(prevProps: Readonly<{ tabTitles: string[]; initialValue: number; tabContents: HTMLElement[] }>, prevState: Readonly<{ value: number }>, snapshot?: any) {
        this.moved = false;
    }

    render(){
        const {tabTitles, tabContents, initialValue} = this.props;
        const handleChange = (event: React.SyntheticEvent, newValue: number) => {
            this.setState({value: newValue});
            this.moved = true;
        };
        let value = (this.moved)?this.state.value:this.props.initialValue;
        return (
            <Box id="tabBox" sx={{ width: '100%', height: '100%'}}>
                <Box className="tabBox" sx={{ borderBottom: 1, borderColor: 'divider'}}>
                    <Tabs value={value} onChange={handleChange} aria-label="basic tabs example"
                          variant="scrollable"
                          scrollButtons="auto">
                        {tabTitles.map((title, index)=>{
                            return <Tab className="tab" key={index} label={title} {...a11yProps(index)} />;
                        })};
                    </Tabs>
                </Box>
                {this.props.tabTitles.map((title, index)=>
                    <TabPanel value={value} key ={index} index={index} content = {tabContents[index]}>
                    </TabPanel>
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