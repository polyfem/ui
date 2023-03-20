import UI from "./main";
import * as React from "react";
import {ToolKit} from "./components/ToolKit";
import NavBar from "./components/NavBar";

class Visual extends React.Component<{ui: UI, rootId: string}, {open:boolean}>{
    constructor(props:{ui: UI, rootId: string}){
        super(props);
        this.state = {open:true};
    }
    render(){
        return <div>
            <NavBar/>
            <ToolKit {...this.props}/>
        </div>;
    }
}

export{Visual};