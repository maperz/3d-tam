import {FDGApplication} from './application/fdg/FDGApplication';
import {HeightmapApplication} from './application/HeightmapApplication';

function main() {
    //const app = new HeightmapApplication();
    const app = new FDGApplication();
    app.start();
}

window.onload = main;
