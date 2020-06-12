import { ComputeApplication } from "./application/ComputeApplication";

function main() {
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
