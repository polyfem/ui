import React, {useState} from 'react';
import {UI} from "../main";
import {FileControl} from "../fileControl";
import Editor from '@monaco-editor/react';

export const CodeFileDisplay = ({ui,rootId,fileControl}:{ui:UI,rootId:string,fileControl:FileControl})=>{
    let file = fileControl.fileReference;
    let initialCode = "";
    file.syncRead(data=>{
        initialCode = data;
    })
    const [code, setCode] = useState(initialCode);
    file.onSaveFile = data => setCode(data);
    const edit = (newValue:string)=>{
        file.saveFile(newValue);
    }

    return <Editor height="95%" theme={'vs-dark'} defaultLanguage={file.extension}
                   defaultValue={code} onChange={edit}/>
}