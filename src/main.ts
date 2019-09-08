import {ComputeApplication} from './application/ComputeApplication';
import {FDGApplication} from './application/fdg/FDGApplication';
import {GEDApplication} from './application/GEDApplication';


function main() {
    //const app = new FDGApplication();
    // const app = new GEDApplication();
    const app = new ComputeApplication();
    app.start();
}

function _main() {
    try {
        main();
    } catch (exception) {
        console.error('Exception thrown at main', exception.stack);
        const error = document.getElementById('error');

        if(error == null) {
            return;
        }

        error.removeAttribute('hidden');
        error.innerHTML = exception.stack;
    }
}

window.onload = _main;
