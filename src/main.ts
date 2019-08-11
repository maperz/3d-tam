import {ComputeApplication} from './application/ComputeApplication';
import {FDGApplication} from './application/fdg/FDGApplication';
import {GEDApplication} from './application/GEDApplication';


function main() {
    const app = new FDGApplication();
    // const app = new GEDApplication();
    // const app = new ComputeApplication();
    app.start();
}

function _main() {
    try {
        main();
    } catch (exception) {
        document.getElementById('error').removeAttribute('hidden');
        document.getElementById('error').innerHTML = exception.stack;
        console.error('Exception thrown at main', exception.stack);
    }
}

window.onload = _main;
