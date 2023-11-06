import React from 'react'
import { SketchPicker } from 'react-color'

/**
 * From https://casesandberg.github.io/react-color/#about
 */
class ColorBox extends React.Component<{color:[number,number,number]},
    {displayColorPicker:boolean,color: {r: string, g: string, b: string, a:string}}>{

    handleClick = (e:React.MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();
        // this.setState({ displayColorPicker: !this.state.displayColorPicker })
    };

    handleClose = (e:React.MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();
        this.setState({ displayColorPicker: false })
    };

    handleChange = (color:any) => {
        this.setState({ color: color.rgb })
    };

    constructor(props:{color:[number,number,number]}){
        super(props);
        this.state = {
            displayColorPicker: false,
            color: {
                r: `${props.color[0]*255}`,
                g: `${props.color[1]*255}`,
                b: `${props.color[2]*255}`,
                a:'1'
            },
        };
    }

    render() {
        const styles = {
                color: {
                    width: '14pt',
                    height: '14pt',
                    marginTop:'auto',
                    marginBottom: 'auto',
                    borderRadius: '2px',
                    background: `rgba(${ this.state.color.r }, ${ this.state.color.g }, ${ this.state.color.b }, ${ this.state.color.a })`,
                },
                swatch: {
                    background: '#fff',
                    borderRadius: '2px',
                    boxShadow: '0 0 0 1px rgba(0,0,0,.1)',
                    display: 'inline-block',
                    cursor: 'pointer',
                    width: '14pt',
                    height: '14pt',
                    marginTop:'auto',
                    marginBottom: 'auto',
                    marginRight:'5pt'
                },
        };

        return (
            <div style={styles.swatch} onClick={this.handleClick}>
                <div style={ styles.color } />
                { this.state.displayColorPicker ? <div style={ {
                    position: 'absolute',
                    right:0,
                    zIndex: '2',} }>
                <div style={{
                    position: 'fixed',
                    top: '0px',
                    right: '0px',
                    bottom: '0px',
                    left: '0px',}} onClick={ this.handleClose }/>
                {/* @ts-ignore */}
                <SketchPicker color={ this.state.color } onChange={ this.handleChange } />
                </div> : null }
            </div>)
        }
    }

    export default ColorBox