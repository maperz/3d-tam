import {setupCanvas2DContext} from '../Context';
import {Application} from './Application';

export abstract class CanvasApplication extends Application {

    start(): void {
        // Call this at the end of start
        setupCanvas2DContext('canvas');
        super.start();
    }
}
