import { BasicExample } from "../src/examples/BasicExample";
import React from "react";
import ReactDOM from "react-dom";

const rootElement = document.getElementById("root");
if (rootElement) {
  ReactDOM.render(
    <React.StrictMode>
      <BasicExample />
    </React.StrictMode>,
    rootElement
  );
}
