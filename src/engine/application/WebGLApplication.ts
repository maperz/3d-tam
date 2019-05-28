import {setupWebGL2Context} from '../Context';
import {Application} from './Application';

export abstract class WebGLApplication extends Application {

    start(attributes = {}): void {
        // Call this at the end of start
        setupWebGL2Context('canvas', attributes);
        super.start();
    }
}
