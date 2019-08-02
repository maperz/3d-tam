import {GUI} from 'dat.gui';
import {mat4, vec2, vec3} from 'gl-matrix';
import {ComputeGLApplication} from '../engine/application/ComputeGLApplication';
import {canvas, gl} from '../engine/Context';
import {TPAssert} from '../engine/error/TPException';
import {DensityMapCalculator} from '../objects/DensityMapCalculator';
import {Dilator} from '../objects/Dilator';
import {FDGCalculator} from '../objects/FDGCalculator';
import {GradientInterpolator} from '../objects/GradientInterpolator';
import {HeightMapRenderer} from '../objects/HeightMapRenderer';

enum RenderMode {
    ShowDilate = 'Show Dilate',
    ShowPush = 'Show Push',
    ShowPull = 'Show Pull',
    ShowDensity = 'Show Density',
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

    fdgCalculator: FDGCalculator;
    dilator: Dilator;
    gradientInterpolator: GradientInterpolator;
    densityMapCalculator: DensityMapCalculator;

    dilateOut: WebGLTexture;
    heightMap: WebGLTexture;

    frameBuffer: WebGLFramebuffer;

    modelRotationY: number = 0;

    heightMapRenderer: HeightMapRenderer;
    perspective: mat4;

    input: WebGLBuffer;

    densityInputTexture: WebGLTexture;

    needsUpdate = true;

    private settings = {
        pushIteration: 1,
        pullIteration: 10,
        densityIteration: 0,
        logDensity: false,
        mode : RenderMode.ShowAll,
        height: 2,
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
        canvas.style.backgroundColor = 'black';

        this.input = gl.createBuffer();
        gl.bindBuffer(gl.SHADER_STORAGE_BUFFER, this.input);

        const values = this.generateRandomInput(this.NUM_SAMPLES);

        gl.bufferData(gl.SHADER_STORAGE_BUFFER, values, gl.DYNAMIC_COPY);

        this.dilator = new Dilator();
        this.dilator.init(this.WIDTH, this.HEIGHT, this.DILATE_RADIUS);

        this.fdgCalculator = new FDGCalculator();
        this.fdgCalculator.init();

        this.gradientInterpolator = new GradientInterpolator();
        this.gradientInterpolator.init(this.WIDTH, this.HEIGHT);

        this.densityMapCalculator = new DensityMapCalculator();
        this.densityMapCalculator.init(this.WIDTH, this.HEIGHT);

        this.heightMapRenderer = new HeightMapRenderer();
        this.heightMapRenderer.init(10, 10, this.WIDTH, this.HEIGHT);

        const aspect = canvas.width / canvas.height;
        this.perspective = mat4.perspective(mat4.create(), 70, aspect, 0.1, 30);

        // create frameBuffer to read from texture
        this.frameBuffer = gl.createFramebuffer();

        this.initGUI();

        gl.enable(gl.DEPTH_TEST);
        gl.depthFunc(gl.LEQUAL);

        this.densityInputTexture = this.createDensityInputTexture(values);
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
        // TODO: Change items to something relative to iterations
        gui.add(this.settings, 'densityIteration', [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
        gui.add(this.settings, 'mode', [
            RenderMode.ShowAll,
            RenderMode.ShowDilate,
            RenderMode.ShowPush,
            RenderMode.ShowPull,
            RenderMode.ShowDensity,
            RenderMode.Show3D,
        ]);
        gui.add(this.settings, 'logDensity');

        gui.add(this.settings, 'height', 0, 5);
    }

    renderPush(x: number = 0, y: number = 0, width: number = this.CANVAS_WIDTH, height: number = this.CANVAS_HEIGHT) {
        gl.bindFramebuffer(gl.READ_FRAMEBUFFER, this.frameBuffer);

        const iteration = this.settings.pushIteration;
        const index =  iteration - 1;
        const output = this.gradientInterpolator.getPushTexture(index);
        const fraction = 2 ** iteration;

        gl.framebufferTexture2D(gl.READ_FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, output, 0);
        gl.blitFramebuffer(
            0, 0, this.WIDTH / fraction, this.HEIGHT / fraction,
            x, y, width, height, gl.COLOR_BUFFER_BIT, gl.NEAREST);
    }

    renderPull(x: number = 0, y: number = 0, width: number = this.CANVAS_WIDTH, height: number = this.CANVAS_HEIGHT) {
        gl.bindFramebuffer(gl.READ_FRAMEBUFFER, this.frameBuffer);

        const iteration = this.settings.pullIteration;
        const index =  iteration - 1;
        const output = this.gradientInterpolator.getPullTexture(index);
        const w = 2 ** iteration;
        const h = 2 ** iteration;

        gl.framebufferTexture2D(gl.READ_FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, output, 0);
        gl.blitFramebuffer(
            0, 0, w, h,
            x, y, width, height, gl.COLOR_BUFFER_BIT, gl.NEAREST);
    }

    renderDilate(x: number = 0, y: number = 0, width: number = this.CANVAS_WIDTH, height: number = this.CANVAS_HEIGHT) {
        gl.bindFramebuffer(gl.READ_FRAMEBUFFER, this.frameBuffer);
        gl.framebufferTexture2D(gl.READ_FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.dilateOut, 0);
        gl.blitFramebuffer(
            0, 0, this.WIDTH, this.HEIGHT,
            x, y, width, height,
            gl.COLOR_BUFFER_BIT, gl.NEAREST);
    }

    renderDensity(x: number = 0, y: number = 0, width: number = this.CANVAS_WIDTH, height: number = this.CANVAS_HEIGHT) {
        gl.bindFramebuffer(gl.READ_FRAMEBUFFER, this.frameBuffer);

        const iteration = this.settings.densityIteration;
        const output = this.densityMapCalculator.getTexture(iteration);

        const fraction = 2 ** iteration;
        
        const w = this.WIDTH / fraction;
        const h = this.HEIGHT / fraction;

        gl.framebufferTexture2D(gl.READ_FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, output.texture, 0);
        gl.blitFramebuffer(
            0, 0, w, h,
            x, y, width, height, gl.COLOR_BUFFER_BIT, gl.NEAREST);

        if (this.settings.logDensity) {
            const pixels = new Float32Array(w * h );
            gl.readPixels(0, 0, w, h, gl.RED, gl.FLOAT, pixels);
            console.log(pixels);
        }
    }

    render3d(deltaTime: number, x: number = 0, y: number = 0, width: number = this.CANVAS_WIDTH, height: number = this.CANVAS_HEIGHT) {
        gl.bindFramebuffer(gl.READ_FRAMEBUFFER, null);

        gl.viewport(x, y, width, height);

        this.modelRotationY += 5 * deltaTime;

        const rotationY = mat4.rotateY(mat4.create(), mat4.identity(mat4.create()), this.modelRotationY / 180 * Math.PI);
        const rotationX = mat4.rotateX(mat4.create(), mat4.identity(mat4.create()), 30 / 180 * Math.PI);
        const model = mat4.mul(mat4.create(), rotationX, rotationY);
        const view = mat4.translate(mat4.create(), mat4.create(), vec3.fromValues(0, 0, -15));

        this.heightMapRenderer.drawWireFrame(this.dilateOut, this.heightMap, this.settings.height, model, view, this.perspective);
    }

    onUpdate(deltaTime: number): void {

        if (this.needsUpdate) {
            this.densityMapCalculator.calculateDensityMap(this.densityInputTexture);
            this.dilateOut = this.dilator.dilate(this.input);
            this.heightMap = this.gradientInterpolator.calculateGradient(this.dilateOut);
            this.needsUpdate = false;
        }

        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        gl.clearDepth(1.0);

        switch (this.settings.mode) {
            case RenderMode.ShowPush: {
                this.renderPush();
                break;
            }

            case RenderMode.ShowPull: {
                this.renderPull();
                break;
            }

            case RenderMode.ShowDilate: {
                this.renderDilate();
                break;
            }

            case RenderMode.Show3D: {
                this.render3d(deltaTime);
                break;
            }

            case RenderMode.ShowDensity: {
                this.renderDensity();
                break;
            }

            case RenderMode.ShowAll: {
                // this.renderDilate(0,0, this.CANVAS_WIDTH/2,this.CANVAS_HEIGHT/2)
                this.renderDensity(0, 0, this.CANVAS_WIDTH / 2, this.CANVAS_HEIGHT / 2);
                this.renderPush(0, this.CANVAS_HEIGHT / 2, this.CANVAS_WIDTH / 2, this.CANVAS_HEIGHT);
                this.renderPull(this.CANVAS_WIDTH / 2, this.CANVAS_HEIGHT / 2, this.CANVAS_WIDTH, this.CANVAS_HEIGHT);
                this.render3d(deltaTime, this.CANVAS_WIDTH / 2, 0, this.CANVAS_WIDTH / 2, this.CANVAS_HEIGHT / 2);
                break;
            }
        }
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

    private createDensityInputTexture(values: Float32Array): WebGLTexture {
        const texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, texture);
        const densityData = new Float32Array(this.WIDTH * this.HEIGHT);

        for (let i = 0; i < this.WIDTH * this.HEIGHT; i++) {
            if (values[i] > 0.0) {
                densityData[i] = 1;
            } else {
                densityData[i] = 0;
            }
        }
        gl.texStorage2D(gl.TEXTURE_2D, 1, gl.R32F, this.WIDTH, this.HEIGHT);
        gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, this.WIDTH, this.HEIGHT, gl.RED, gl.FLOAT, densityData);
        return texture;
    }
}
