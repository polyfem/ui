import UI from "../main";
import * as React from "react";
import Tabs from '@mui/joy/Tabs';
import TabList from '@mui/joy/TabList';
import Tab from '@mui/joy/Tab';
import TabPanel from '@mui/joy/TabPanel';
import Typography from "@mui/material/Typography";
import { styled } from '@mui/material/styles';
import MuiGrid from '@mui/material/Grid';
import Divider from '@mui/material/Divider';
import KeyboardDoubleArrowRightIcon from '@mui/icons-material/KeyboardDoubleArrowRight';

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
                ...
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

class TabPane extends React.Component<{ui:UI, rootId: string}, any>{
    render(){
        return (
            <Tabs aria-label="Basic tabs" defaultValue={0} sx={{ borderRadius: 'lg', height:'100%'}}>
                <TabList variant="outlined" color="neutral">
                    <Tab color='primary' variant='soft'>First tab</Tab>
                    <Tab color='primary' variant='soft'>Second tab</Tab>
                    <Tab color='primary' variant='soft'>Third tab</Tab>
                </TabList>
                <div style={{height:`${window.innerHeight*0.75}px`, overflow: 'auto' }}>
                <TabPanel value={0} sx={{ p: 2 }}>
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
                </div>
                <TabPanel value={1} sx={{ p: 2 }}>
                    <b>Second</b> tab panel
                </TabPanel>
                <TabPanel value={2} sx={{ p: 2 }}>
                    <b>Third</b> tab panel
                </TabPanel>
            </Tabs>
        );
    }
}

export default EditorPane;