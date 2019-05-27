import {RegionGenerationApplication} from './application/RegionGenerationApplication';
import {FDGApplication} from './application/fdg/FDGApplication';
import {HeightmapApplication} from './application/HeightmapApplication';

function main() {
    //const app = new HeightmapApplication();
    //const app = new FDGApplication();
    const app = new RegionGenerationApplication();
    app.start();
}

window.onload = main;
