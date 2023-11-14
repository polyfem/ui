import {Input, InputAdornment, TextField} from "@mui/material";
import * as React from "react";
import {Spec} from "../spec";
import {ChangeEvent, useEffect, useState} from "react";

export const SmartField = ({specNode, compactEntry=false}:{specNode:Spec, compactEntry?:boolean})=>{
    let initialValue = (compactEntry&&specNode.type=='float')?processNumber(specNode.value):specNode.value;
    let [text, setText] = useState(initialValue);
    const onChange = (e: any) => {
        e.preventDefault();
        // @ts-ignore
        if (specNode.type == 'float' && isNaN(e.target.value) && e.target.value!='.' && e.target.value!='-') {
            return;
        }
        // @ts-ignore
        specNode.setValue(e.target.value);
    }
    useEffect(() => {
        let valueService = () => {
            // In case of value NaN,
            let value = (compactEntry&&specNode.type=='float')?processNumber(specNode.value):specNode.value;
            setText(value);
        };
        specNode.subscribeValueService(valueService);
        return () => { //Unsubscribe the service upon component shut down
            specNode.unsubscribeValueService(valueService);
        };
    }, [setText]);
    return (!compactEntry)?<TextField
        FormHelperTextProps={{style: {textAlign: 'right', color: '#037746'}}}
        size="small"
        variant="standard"
        helperText={specNode.type}
        disabled={specNode.tentative || specNode.deleteReady}
        style={{verticalAlign: 'baseline'}} value={text} onChange={onChange}/>:
        <Input
            size="small"
            onClick={(e)=>{
                if(compactEntry)
                    e.stopPropagation();
            }}
            endAdornment={<InputAdornment position="end">,</InputAdornment>}
            disabled={specNode.tentative || specNode.deleteReady}
            style={{verticalAlign: 'baseline', maxWidth:'39pt', paddingLeft:'3pt'}} value={text} onChange={onChange}/>
}

function processNumber(numberInput: string){
    if(numberInput=='')
        return numberInput;
    if(isNaN(Number(numberInput)))
        return numberInput;
    let val = Number(numberInput);
    if(Number.isInteger(val*1000)){
        if(numberInput.toString().indexOf('.')>=0)
            return numberInput;
        return val
    }else{
        return val.toFixed(4);
    }
}