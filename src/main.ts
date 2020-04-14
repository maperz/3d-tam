import { ComputeApplication } from "./application/ComputeApplication";
import { FDGApplication } from "./application/fdg/FDGApplication";
import { GEDApplication } from "./application/GEDApplication";

function main() {
  //const app = new FDGApplication();
  //const app = new GEDApplication();
  const app = new ComputeApplication();
  app.start();
}

window.addEventListener("error", function(e) {
  console.error("Exception thrown at main", e.error.stack);
  const error = document.getElementById("error");

  if (error == null) {
    return;
  }

  error.removeAttribute("hidden");
  error.innerHTML = e.error.stack;

  return false;
});

window.onload = main;
