import {setupCanvas2DContext, setupWebGL2Context} from '../Context';

/**
 * Runnable application that initialises the GL context
 * and keeps running in a loop.
 */
export abstract class Application {

    get fps(): number {
        return this.framesPerSecond;
    }

    // Counter stuff for loop statistics
    lastTime: number = 0;
    counter: number = 0;
    frames: number = 0;
    framesPerSecond: number = 0;
    private startLoopManually = false;

    start(): void {
        this.onStart();
        if (!this.startLoopManually) {
            this.loop();
        }
    }

    abstract onStart(): void;
    abstract onUpdate(deltaTime: number): void;

    protected setStartLoopManually(startManually: boolean) {
        this.startLoopManually = startManually;
    }

    protected startLoop() {
        if (this.startLoopManually) {
            this.loop();
        }
    }

    private loop(): void {
        let deltaTime: number = 16; // ~ 1000ms / 60 Frames
        const time = new Date().getTime();
        if (this.lastTime !== 0) {
            deltaTime = time - this.lastTime;
        }
        this.lastTime = time;

        this.counter += deltaTime;
        this.frames += 1;

        if (this.counter >= 1000) {
            this.framesPerSecond = this.frames;
            this.counter = 0;
            this.frames = 0;
        }

        this.onUpdate(deltaTime / 1000);
        requestAnimationFrame(this.loop.bind(this));
    }
}
