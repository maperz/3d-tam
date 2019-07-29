import {GUI} from 'dat.gui';
import {mat4, vec2} from 'gl-matrix';
import {ComputeGLApplication} from '../engine/application/ComputeGLApplication';
import {canvas, gl} from '../engine/Context';
import {TPAssert} from '../engine/error/TPException';
import {HeightMapRenderer} from '../engine/HeightMapRenderer';
import {Mat4} from '../engine/math/mat4';
import {inRadians} from '../engine/math/Utils';
import {Dilator} from '../objects/Dilator';
import {GradientInterpolator} from '../objects/GradientInterpolator';

enum RenderMode {
    ShowDilate = 'Show Dilate',
    ShowPush = 'Show Push',
    ShowPull = 'Show Pull',
    Show3D = 'Show 3D',
    ShowAll = 'Show All',
}

export class ComputeApplication extends ComputeGLApplication {

    readonly CANVAS_WIDTH = 1024;
    readonly CANVAS_HEIGHT = 1024;

    readonly WIDTH = 1024;
    readonly HEIGHT = 1024;

    readonly DILATE_RADIUS = 1;
    readonly NUM_SAMPLES = 200;

    dilator: Dilator;
    gradientInterpolator: GradientInterpolator;

    dilateOut: WebGLTexture;
    heightMap: WebGLTexture;

    frameBuffer: WebGLFramebuffer;

    modelRotationY: number = 0;

    heightMapRenderer: HeightMapRenderer;
    perspective: Mat4;

    input: WebGLBuffer;

    private settings = {
        pushIteration: 1,
        pullIteration: 10,
        mode : RenderMode.ShowAll,
        height: 2
    };


    start(): void {
        super.start({antialias : false});
    }

    onStart(): void {

        const ext = gl.getExtension('EXT_color_buffer_float');
        TPAssert(ext != null, 'Cannot render to floating point FBOs!');

        canvas.width = this.CANVAS_WIDTH;
        canvas.height = this.CANVAS_HEIGHT;
        gl.viewport(0, 0, this.CANVAS_WIDTH, this.CANVAS_HEIGHT);
        gl.clearColor(0.0, 0.0, 0.0, 0.0);
        canvas.style.backgroundColor = "black";

        this.input = gl.createBuffer();
        gl.bindBuffer(gl.SHADER_STORAGE_BUFFER, this.input);

        const values = this.generateRandomInput(this.NUM_SAMPLES);

        gl.bufferData(gl.SHADER_STORAGE_BUFFER, values, gl.DYNAMIC_COPY);


        this.dilator = new Dilator();
        this.dilator.init(this.WIDTH, this.HEIGHT, this.DILATE_RADIUS);

        this.gradientInterpolator = new GradientInterpolator();
        this.gradientInterpolator.init(this.WIDTH, this.HEIGHT);

        const aspect = canvas.width / canvas.height;
        this.perspective = Mat4.perspective(70, aspect, 0.1, 30);

        // create frameBuffer to read from texture
        this.frameBuffer = gl.createFramebuffer();

        this.initGUI();

        gl.enable(gl.DEPTH_TEST);
        gl.depthFunc(gl.LEQUAL);

        this.heightMapRenderer = new HeightMapRenderer();
        this.heightMapRenderer.init(10, 10, this.WIDTH, this.HEIGHT);

    }


    initGUI(): void {
        const gui: GUI = new GUI({width: 300});

        gui.remember(this.settings);
        const iterations = [];
        for (let iteration = 1; iteration <= this.gradientInterpolator.getNumberIterationsPush(); iteration++) {
            iterations.push(iteration);
        }
        gui.add(this.settings, 'pushIteration', iterations);
        gui.add(this.settings, 'pullIteration', iterations);
        gui.add(this.settings, 'mode', [
            RenderMode.ShowAll,
            RenderMode.ShowDilate,
            RenderMode.ShowPush,
            RenderMode.ShowPull,
            RenderMode.Show3D,
        ]);
        gui.add(this.settings, 'height', 0, 5);
    }

    onUpdate(deltaTime: number): void {

        this.dilateOut = this.dilator.dilate(this.input);
        this.heightMap = this.gradientInterpolator.calculateGradient(this.dilateOut);

        switch (this.settings.mode) {
            case RenderMode.ShowPush: {
                gl.bindFramebuffer(gl.READ_FRAMEBUFFER, this.frameBuffer);

                const iteration = this.settings.pushIteration;
                const index =  iteration - 1;
                const output = this.gradientInterpolator.getPushTexture(index);
                const fraction = 2 ** iteration;

                gl.framebufferTexture2D(gl.READ_FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, output, 0);
                gl.blitFramebuffer(
                    0, 0, this.WIDTH / fraction, this.HEIGHT / fraction,
                    0, 0, this.CANVAS_WIDTH, this.CANVAS_HEIGHT,
                    gl.COLOR_BUFFER_BIT, gl.NEAREST);
                break;
            }

            case RenderMode.ShowPull: {
                gl.bindFramebuffer(gl.READ_FRAMEBUFFER, this.frameBuffer);

                // Pull
                const iteration = this.settings.pullIteration;
                const index =  iteration - 1;
                const output = this.gradientInterpolator.getPullTexture(index);
                const width = 2 ** iteration;
                const height = 2 ** iteration;

                gl.framebufferTexture2D(gl.READ_FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, output, 0);
                gl.blitFramebuffer(
                    0, 0, width, height,
                    0, 0, this.CANVAS_WIDTH, this.CANVAS_HEIGHT,
                    gl.COLOR_BUFFER_BIT, gl.NEAREST);

                break;
            }

            case RenderMode.ShowDilate: {
                gl.bindFramebuffer(gl.READ_FRAMEBUFFER, this.frameBuffer);
                gl.framebufferTexture2D(gl.READ_FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.dilateOut, 0);
                gl.blitFramebuffer(
                    0, 0, this.WIDTH, this.HEIGHT,
                    0, 0, this.CANVAS_WIDTH, this.CANVAS_HEIGHT,
                    gl.COLOR_BUFFER_BIT, gl.NEAREST);
                break;
            }

            case RenderMode.Show3D: {

                gl.bindFramebuffer(gl.READ_FRAMEBUFFER, null);
                gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
                gl.clearDepth(1.0);
                gl.viewport(0 ,0, this.CANVAS_WIDTH, this.CANVAS_HEIGHT);

                this.modelRotationY += 5 * deltaTime;

                const model = Mat4.multiply(
                    Mat4.rotationY(inRadians(this.modelRotationY)),
                    Mat4.rotationX(inRadians(-30))
                    // Mat4.rotationX(inRadians(  Math.sin(deltaTime / 10) * 15 - 15))
                );
                const view = Mat4.translate(0, 0, -15);

                this.heightMapRenderer.drawWireFrame(this.dilateOut, this.heightMap, this.settings.height, model, view, this.perspective);

                break;
            }

            case RenderMode.ShowAll: {
                this.renderAll(deltaTime);
                break;
            }
        }


    }

    private renderAll(deltaTime: number){
        // 3D
        gl.bindFramebuffer(gl.READ_FRAMEBUFFER, null);
        gl.viewport(this.CANVAS_WIDTH / 2, 0, this.CANVAS_WIDTH / 2, this.CANVAS_HEIGHT / 2);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        gl.clearDepth(1.0);

        this.modelRotationY += 5 * deltaTime;

        const model = Mat4.multiply(
            Mat4.rotationY(inRadians(this.modelRotationY)),
            Mat4.rotationX(inRadians(-30))
            // Mat4.rotationX(inRadians(  Math.sin(deltaTime / 10) * 15 - 15))
        );
        const view = Mat4.translate(0, 0, -15);

        this.heightMapRenderer.drawWireFrame(this.dilateOut, this.heightMap, this.settings.height, model, view, this.perspective);

        gl.bindFramebuffer(gl.READ_FRAMEBUFFER, this.frameBuffer);
        gl.framebufferTexture2D(gl.READ_FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.dilateOut, 0);
        gl.blitFramebuffer(
            0, 0, this.WIDTH, this.HEIGHT,
            0, 0, this.CANVAS_WIDTH/2, this.CANVAS_HEIGHT/2,
            gl.COLOR_BUFFER_BIT, gl.NEAREST);


        // Push
        gl.bindFramebuffer(gl.READ_FRAMEBUFFER, this.frameBuffer);

        let iteration = this.settings.pushIteration;
        let index =  iteration - 1;
        let output = this.gradientInterpolator.getPushTexture(index);
        let fraction = 2 ** iteration;

        gl.framebufferTexture2D(gl.READ_FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, output, 0);
        gl.blitFramebuffer(
            0, 0, this.WIDTH / fraction, this.HEIGHT / fraction,
            0, this.CANVAS_HEIGHT / 2, this.CANVAS_WIDTH / 2, this.CANVAS_HEIGHT,
            gl.COLOR_BUFFER_BIT, gl.NEAREST);


        gl.bindFramebuffer(gl.READ_FRAMEBUFFER, this.frameBuffer);

        // Pull
        iteration = this.settings.pullIteration;
        index =  iteration - 1;
        output = this.gradientInterpolator.getPullTexture(index);
        const width = 2 ** iteration;
        const height = 2 ** iteration;

        gl.framebufferTexture2D(gl.READ_FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, output, 0);
        gl.blitFramebuffer(
            0, 0, width, height,
            this.CANVAS_WIDTH / 2, this.CANVAS_HEIGHT / 2, this.CANVAS_WIDTH, this.CANVAS_HEIGHT,
            gl.COLOR_BUFFER_BIT, gl.NEAREST);
    }

    private generateRandomInput(samples: number): Float32Array {
        const data = new Float32Array(this.WIDTH * this.HEIGHT);

        for (let x = 0; x < samples; ++x) {
            const pos = vec2.fromValues(Math.random(), Math.random());
            vec2.floor(pos, vec2.mul(pos, pos, vec2.fromValues(this.WIDTH, this.HEIGHT)));
            const index = pos[0] + pos[1] * this.WIDTH;

            const value = Math.random();
            data[index] = value;
        }

        return data;
    }

}
