import * as React from "react";
import {Main} from "./main";


class OperationPanel extends React.Component<{ main: Main }, {value: string}> {
    constructor(props) {
        super(props);
        this.state = {value:""};
        this.execute = this.execute.bind(this);
        this.handleChange = this.handleChange.bind(this);
    }
    componentDidMount() {
    }
    render() {
        return <div id='operationPanel'>
        <form onSubmit={this.execute}>
            <fieldset>
                <legend>PolyFEM:</legend>
        <label>
            <input type="text" value={
                this.props.main.activeFileControl.fileReference.url
            } onChange={this.handleChange} />
        </label>

        <input className='controlBtn' type='submit'  value='run' /> <br/>
        <input type="checkbox" id='cmd' name="cmd" checked={true}/>
                <label htmlFor="cmd">--cmd</label>
                <br/>
        <input type="checkbox" id='json' name="json" checked={true}/>
                <label htmlFor="json">--json</label>
                <br/>
            </fieldset>
            </form>
            </div>;
    }
    execute(event){
        event.preventDefault();
        let target=this.props.main.activeFileControl.fileReference.url;
        this.props.main.executeCommand(target, (newResponse, response)=>{
            this.props.main.setResponse(response);
        });
    }
    handleChange(event){
        this.setState({value: event.target.value});
    }

}

export default OperationPanel;