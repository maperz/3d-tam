import {FDGApplication} from './application/fdg/FDGApplication';
import {HeightmapApplication} from './application/HeightmapApplication';
import {RegionGenerationApplication} from './application/RegionGenerationApplication';

function main() {
     const app = new HeightmapApplication();
    // const app = new FDGApplication();
    //const app = new RegionGenerationApplication();
    app.start();
}

window.onload = main;
