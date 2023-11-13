import React, {useState} from 'react';
import {UI} from "../main";
import {FileControl} from "../fileControl";
import Editor from '@monaco-editor/react';

export const CodeFileDisplay = ({ui,rootId,fileControl}:{ui:UI,rootId:string,fileControl:FileControl})=>{
    let file = fileControl.fileReference;
    const [code, setCode] = useState("");
    file.asyncRead((data)=>setCode(data));
    file.onSaveFile = data => setCode(data);
    const edit = (newValue:string)=>{
        file.saveFile(newValue);
    }

    return <Editor height="95%" theme={'vs-dark'} defaultLanguage="javascript"
                   defaultValue={code} onChange={edit}/>
}