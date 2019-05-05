import {Application, CanvasApplication} from '../engine/Application';
import {canvas, ctx} from '../engine/Context';

export class FDGApplication extends CanvasApplication {

    readonly BACKGROUND_COLOR = "#e2e2e2"

    onStart(): void {
        canvas.style.backgroundColor = this.BACKGROUND_COLOR;
    }

    onUpdate(deltaTime: number): void {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "#FF0000";
        ctx.fillRect(20, 50, 150, 75);
    }
}
