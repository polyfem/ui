import * as React from "react";
import {useEffect} from "react";
import "prismjs";

//@ts-ignore
Prism.manual = true;
class CodePanel extends React.Component<{ code: string, language: string }>{
    componentDidUpdate() {
        //@ts-ignore
        Prism.highlightAll();
    }
    componentDidMount() {
        //@ts-ignore
        Prism.highlightAll();
    }
    render(){
        return (
            <div className="Code">
        <pre>
            <code className={`language-${this.props.language}`}>{this.props.code}</code>
    </pre>
            </div>
        );
    }
}

export {CodePanel}