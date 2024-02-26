import React, {useState} from 'react';
import {UI} from "../main";
import {FileControl} from "../fileControl";
import Editor from '@monaco-editor/react';
import Box from "@mui/material/Box";

export const Terminal = ({code, visible}:{code:string,visible: boolean})=>{
    return <Box style={{height:'300pt',width:'100%', zIndex:2999,position:'absolute', bottom:'20pt', visibility:(visible)?'visible':'hidden'}}>
        <Editor height="100%" width="100%" theme={'vs-dark'} defaultLanguage={"powershell"}
                value={code}
                onMount={(editor)=>{
                    // editor.remove
                }}
        />
    </Box>
}