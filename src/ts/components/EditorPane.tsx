import {UI} from "../main";
import * as React from "react";
import Typography from "@mui/material/Typography";
import { styled } from '@mui/material/styles';
import MuiGrid from '@mui/material/Grid';
import Divider from '@mui/material/Divider';
import KeyboardDoubleArrowRightIcon from '@mui/icons-material/KeyboardDoubleArrowRight';
import SpecPane from "./SpecPane";
import {Box, IconButton, Tabs, Tab} from "@mui/material";
import CloseIcon from '@mui/icons-material/Close';

const Grid = styled(MuiGrid)(({ theme }) => ({
    width: '100%',
    height: '100%',
    ...theme.typography.body2,
    '& [role="separator"]': {
        margin: theme.spacing(0, 2),
    },
}));


class EditorPane extends React.Component<{ui: UI, rootId: string}, any>{
    render(){
        return <Grid container>
            <Grid item xs={3}>
                <SpecPane {...{...this.props, specRoot:this.props.ui.spec}}/>
            </Grid>
            <Divider orientation="vertical" flexItem>
                <KeyboardDoubleArrowRightIcon/>
            </Divider>
            <Grid item xs>
                <TabPane {...this.props}/>
            </Grid>
        </Grid>;
    }
}

interface TabPanelProps {
    children?: React.ReactNode;
    index: number;
    value: number;
}

function TabPanel(props: TabPanelProps) {
    const { children, value, index, ...other } = props;

    return (
        // <div style={{height:`${window.innerHeight*0.75}px`, overflow: 'auto' }}>
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`simple-tabpanel-${index}`}
            aria-labelledby={`simple-tab-${index}`}
            {...other}
            style={{height:'100%', overflow:'auto'}}
        >
            {value === index && (
                <Box sx={{ p: 3 }}>
                    <Typography>{children}</Typography>
                </Box>
            )}
        </div>
    );
}

function a11yProps(index: number) {
    return {
        id: `simple-tab-${index}`,
        'aria-controls': `simple-tabpanel-${index}`,
    };
}

class TabPane extends React.Component<{ui:UI, rootId: string}, {value: number}>{
    constructor(props: { ui: UI, rootId: string}) {
        super(props);
        this.handleChange = this.handleChange.bind(this);
        this.state={value: 0};
    }
    handleChange (event: React.SyntheticEvent, newValue: number) {
        this.setState({value: newValue});
    }

    render(){
        let value = this.state.value;
        return (
            <Box sx={{ width: '100%'}}>
                <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                    <Tabs value={value} onChange={this.handleChange}
                          sx={{height: '17pt', padding: '0pt'}} aria-label="basic tabs example">
                        <Tab label="Item One" {...a11yProps(0)}
                             icon={<CloseIcon />} iconPosition="end" />
                        <Tab label="Item Two" {...a11yProps(1)}
                             icon={<CloseIcon />} iconPosition="end" />
                        <Tab label="Item Three" {...a11yProps(2)}
                             icon={<CloseIcon />} iconPosition="end" />
                    </Tabs>
                </Box>
                <TabPanel value={value} index={0} >
                    <Typography paragraph>
                        Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod
                        tempor incididunt ut labore et dolore magna aliqua. Rhoncus dolor purus non
                        enim praesent elementum facilisis leo vel. Risus at ultrices mi tempus
                        imperdiet. Semper risus in hendrerit gravida rutrum quisque non tellus.
                        Convallis convallis tellus id interdum velit laoreet id donec ultrices.
                        Odio morbi quis commodo odio aenean sed adipiscing. Amet nisl suscipit
                        adipiscing bibendum est ultricies integer quis. Cursus euismod quis viverra
                        nibh cras. Metus vulputate eu scelerisque felis imperdiet proin fermentum
                        leo. Mauris commodo quis imperdiet massa tincidunt. Cras tincidunt lobortis
                        feugiat vivamus at augue. At augue eget arcu dictum varius duis at
                        consectetur lorem. Velit sed ullamcorper morbi tincidunt. Lorem donec massa
                        sapien faucibus et molestie ac.
                    </Typography>
                    <Typography paragraph>
                        Consequat mauris nunc congue nisi vitae suscipit. Fringilla est ullamcorper
                        eget nulla facilisi etiam dignissim diam. Pulvinar elementum integer enim
                        neque volutpat ac tincidunt. Ornare suspendisse sed nisi lacus sed viverra
                        tellus. Purus sit amet volutpat consequat mauris. Elementum eu facilisis
                        sed odio morbi. Euismod lacinia at quis risus sed vulputate odio. Morbi
                        tincidunt ornare massa eget egestas purus viverra accumsan in. In hendrerit
                        gravida rutrum quisque non tellus orci ac. Pellentesque nec nam aliquam sem
                        et tortor. Habitant morbi tristique senectus et. Adipiscing elit duis
                        tristique sollicitudin nibh sit. Ornare aenean euismod elementum nisi quis
                        eleifend. Commodo viverra maecenas accumsan lacus vel facilisis. Nulla
                        posuere sollicitudin aliquam ultrices sagittis orci a.
                    </Typography>
                </TabPanel>
                <TabPanel value={value} index={1}>
                    Item Two
                </TabPanel>
                <TabPanel value={value} index={2}>
                    Item Three
                </TabPanel>
            </Box>
        );
    }
}

export default EditorPane;