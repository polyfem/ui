import * as React from "react";
import { useState,useEffect} from 'react';
import Element from '../settingsPage/component/Element';

function SettingsForm() {
  // const [elements,setElements] = useState(null);
  // useEffect(()=>{
  //   // setElements(formJSON[0])
  // },[])
  // const {pointer,type,required,optional,doc} = elements??{}
  return (
    <div className="App container">
      <h3>JSON Generator FORM</h3>
  <form>
    {/* {pointer ? pointer.map((pointer,i) => <Element key = {i} />) :
    null} */}
    <div className="mb-3">
      <label htmlFor="exampleInputEmail1" className="form-label">File Name</label>
      <input type="email" className="form-control" id="exampleInputEmail1" aria-describedby="emailHelp" />
      {/* <div id="emailHelp" className="form-text">We'll never share your email with anyone else.</div> */}
    </div>
    {/* <div className="mb-3">
      <label htmlFor="exampleInputPassword1" className="form-label">Password</label>
      <input type="password" className="form-control" id="exampleInputPassword1" />
    </div> */}
    <div className="mb-3 form-check">
      <input type="checkbox" className="form-check-input" id="exampleCheck1" />
      <label className="form-check-label" htmlFor="exampleCheck1">Check me out</label>
    </div>
    <select className="form-select" aria-label="Default select example">
  <option selected>Open this select menu</option>
  <option value={1}>One</option>
  <option value={2}>Two</option>
  <option value={3}>Three</option>
</select>
<select className="form-select" aria-label="Default select example">
  <option selected>Open this select menu</option>
  <option value={1}>One</option>
  <option value={2}>Two</option>
  <option value={3}>Three</option>
</select>
<select className="form-select" aria-label="Default select example">
  <option selected>Open this select menu</option>
  <option value={1}>One</option>
  <option value={2}>Two</option>
  <option value={3}>Three</option>
</select>
<select className="form-select" aria-label="Default select example">
  <option selected>Open this select menu</option>
  <option value={1}>One</option>
  <option value={2}>Two</option>
  <option value={3}>Three</option>
</select>
    <button type="submit" className="btn btn-primary">Generate</button>

  </form>
</div>

  );
}

export default SettingsForm;
