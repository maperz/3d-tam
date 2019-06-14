import {ComputeApplication} from './application/ComputeApplication';
import {FDGApplication} from './application/fdg/FDGApplication';
import {HeightmapApplication} from './application/HeightmapApplication';
import {RegionGenerationApplication} from './application/RegionGenerationApplication';

function main() {
    const app = new HeightmapApplication();
    // const app = new FDGApplication();
    // const app = new RegionGenerationApplication();
    // const app = new ComputeApplication();
    app.start();
}

function _main() {
    try {
        main();
    }
    catch (exception) {
        document.getElementById("error").removeAttribute("hidden")
        document.getElementById("error").innerHTML=exception.stack;
        console.error("Exception thrown at main", exception.stack);
    }
}

window.onload = _main;
