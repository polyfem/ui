import React from 'react';
import logo from './logo.svg';
import './App.css';
import {UI} from "./ui/main";
import {Visual} from "./ui/visual";


let ui = new UI();
function App() {
  return (
      <Visual ui={ui} rootId={'root'}/>
  );
}

export default App;
