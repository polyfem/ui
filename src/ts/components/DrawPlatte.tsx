import {FormControl, Stack, Slider, TextField, InputAdornment} from "@mui/material";
import React from "react";
import {UI} from "../main";
import {GFileControl} from "../fileControl";
import RadioButtonCheckedIcon from '@mui/icons-material/RadioButtonChecked';

function valuetext(value: number) {
    return `${value}°`;
}

export default function DrawPlatte({ui,rootId, fileControl, drawPlatteOpen, rid}: {ui: UI, rid: string, rootId: string, fileControl: GFileControl,drawPlatteOpen:boolean}) {
    return (
        <FormControl style={{position:'absolute', right:'20pt', bottom:'70pt',width:'fit-content'}}>
            <Stack direction="row" >
                <Stack style={{border:`${(drawPlatteOpen)?'1px':0} solid #ccc`, background:'rgba(256,256,256,0.7)', height:'60pt', padding:'5pt',
                    maxWidth:(drawPlatteOpen)?'300pt':0,transition:'all 0.5s', overflow:'hidden', borderRadius:'16px'}} alignItems='end' direction="row">
                    <TextField
                        id="standard-start-adornment"
                        sx={{ m: 1, width: '40pt', height:'20pt', alignSelf:'center' }}
                        InputProps={{
                            startAdornment: <InputAdornment position="start">id:</InputAdornment>,
                        }}
                        variant="standard"
                        onChange={(event)=>{
                            fileControl.drawService?.onRidChanged(fileControl.drawService.rid,`${parseInt(event.target.value)}`)
                        }}
                    />
                    <Stack spacing={2} direction="row" alignItems='center' sx={{ mb: 1, height:'20pt'}}>
                        <div style={{whiteSpace:'nowrap'}}>pen size:</div>
                        <RadioButtonCheckedIcon fontSize={'small'}/>
                        <Slider
                            aria-label="Custom marks"
                            defaultValue={10}
                            getAriaValueText={valuetext}
                            step={1}
                            min={1}
                            max={180}
                            valueLabelDisplay="auto"
                            sx={{width:'100pt'}}
                            onChange={(event)=>{ // @ts-ignore
                                fileControl.drawService?.phi=Math.PI*event.target.value/180}}
                        />
                        <RadioButtonCheckedIcon fontSize={'medium'}/>
                    </Stack>

                </Stack>
            </Stack>
        </FormControl>
    );
}