import {setupComputeGLContext} from '../Context';
import {Application} from './Application';

export abstract class ComputeGLApplication extends Application {

    start(attributes = {}): void {
        // Call this at the end of start
        setupComputeGLContext('canvas', attributes);
        super.start();
    }
}
