import * as React from "react";
import {Main} from "./main";


class OperationPanel extends React.Component<{ main: Main, configs:[]}, {target: string}> {

    configs: [];
    constructor(props) {
        super(props);
        this.state = {target:""};
        this.configs=this.props.configs;
        this.handleChange = this.handleChange.bind(this);
    }
    componentDidMount() {
    }
    render() {
        return <div id='operationPanel'>
            <label>
                <input type="text" value={
                    this.props.main.activeFileControl.fileReference.url
                } onChange={this.handleChange} />
                {this.configs.map((config,index)=>//Map multiple configs into UIs
                    <FieldSet config={config} key={index} main={this.props.main}
                           target={this.props.main.activeFileControl.fileReference.url}/>)
                }
            </label>
        </div>;
    }
    handleChange(event){
        this.setState({target: event.target.value});
    }
}

class FieldSet extends React.Component<{ main: Main, config: {}, target: string }, {paramSelections:boolean[]}>{
    //A list structure to modify whether certain parameters are selected
    paramSelections:boolean[] = [];
    constructor(props) {
        super(props);
        let config = this.props.config;
        this.execute = this.execute.bind(this);
        for(let key in config['execOptions']){
            //Default, naming 'default' interrupts code so def
            let def = config['execOptions'][key]['default'];
            this.paramSelections[key] = (def!=undefined)?def:false;
        }
        this.state = {paramSelections:this.paramSelections};
        this.checked=this.checked.bind(this);
    }
    render(){
        let execOptions = this.props.config['execOptions'];
        return <form onSubmit={this.execute}>
            <fieldset>
                <legend>{this.props.config['section']}:</legend>
                <input className='controlBtn' type='submit'  value='run' /> <br/>
                {execOptions.map((option, index)=>{
                    let id = 'optionfield-'+this.props.config['section']+'-'+String(index);
                    return <React.Fragment key={index}>
                        <input type="checkbox"  data-id={index} id={id} name={option['param']}
                               checked={this.state.paramSelections[index]} onChange={this.checked}/>
                        <label htmlFor={id}>{option['description']}</label>
                        <br/></React.Fragment>})}
            </fieldset>
        </form>;
    }
    execute(event){
        event.preventDefault();
        let target=this.props.main.activeFileControl.fileReference.url;
        let params = [];
        for(let index in  this.paramSelections){
            if(this.paramSelections[index]){
                params.push(this.props.config['execOptions'][index]['param']);
            }
        }
        this.props.main.executeCommand('./bin/polyfem.exe',target, params,(newResponse, response)=>{
            this.props.main.setResponse(response);
        });
    }
    checked(event){
        // event.preventDefault();
        let id = event.target.getAttribute('data-id');
        this.paramSelections[id]=!this.paramSelections[id];
        this.setState({paramSelections: this.paramSelections});
        console.log(this.paramSelections);
    }
}

export default OperationPanel;