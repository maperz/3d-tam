import {GUI} from 'dat.gui';
import {mat4, vec2, vec3} from 'gl-matrix';
import {ComputeGLApplication} from '../engine/application/ComputeGLApplication';
import {canvas, gl} from '../engine/Context';
import {TPAssert} from '../engine/error/TPException';
import {Dilator} from '../objects/Dilator';
import {FDGBuffers} from '../objects/FDGBuffers';
import {FDGCalculator} from '../objects/FDGCalculator';
import {FDGDebugRenderer} from '../objects/FDGDebugRenderer';
import {GedcomPreparator} from '../objects/ged/GedcomPreparator';
import {GradientInterpolator} from '../objects/GradientInterpolator';
import {GraphData} from '../objects/GraphData';
import {HeightMapRenderer} from '../objects/HeightMapRenderer';

enum RenderMode {
    Dilate = 'Show Dilate',
    Push = 'Show Push',
    Pull = 'Show Pull',
    Density = 'Show Density',
    Scene3D = 'Show 3D Scene',
    All = 'Show All',
    FDGDebug = 'FDG Debug',
}

export class ComputeApplication extends ComputeGLApplication {

    readonly CANVAS_WIDTH = 1024;
    readonly CANVAS_HEIGHT = 1024;

    readonly WIDTH = 1024;
    readonly HEIGHT = 1024;

    readonly DILATE_RADIUS = 2;
    readonly NUM_SAMPLES = 200;

    graphData: GraphData;

    fdgBuffers: FDGBuffers;
    fdgCalculator: FDGCalculator;
    dilator: Dilator;
    gradientInterpolator: GradientInterpolator;

    dilateOut: WebGLTexture;
    heightMap: WebGLTexture;

    frameBuffer: WebGLFramebuffer;

    modelRotationY: number = 0;

    heightMapRenderer: HeightMapRenderer;
    fdgDebugRenderer: FDGDebugRenderer;

    perspective: mat4;

    private settings = {
        pushIteration: 1,
        pullIteration: 10,
        densityIteration: 0,
        logDensity: false,
        mode : RenderMode.FDGDebug,
        height: 2,
        updateGraph: true
    };

    start(): void {
        super.start({antialias : false});
    }

    loadGraphData(): void {
        const input = (<HTMLScriptElement>document.getElementById('gedcom')).text;
        const preparator = new GedcomPreparator();
        preparator.init(input);
        this.graphData = preparator.getGraphData();
    }

    onStart(): void {

        const ext = gl.getExtension('EXT_color_buffer_float');
        TPAssert(ext != null, 'Cannot render to floating point FBOs!');

        canvas.width = this.CANVAS_WIDTH;
        canvas.height = this.CANVAS_HEIGHT;
        gl.viewport(0, 0, this.CANVAS_WIDTH, this.CANVAS_HEIGHT);
        gl.clearColor(0.0, 0.0, 0.0, 0.0);
        canvas.style.backgroundColor = 'black';

        this.loadGraphData();

        this.fdgBuffers = new FDGBuffers();
        this.fdgBuffers.init(this.WIDTH, this.HEIGHT, this.graphData);

        this.dilator = new Dilator();
        this.dilator.init(this.WIDTH, this.HEIGHT, this.DILATE_RADIUS);

        this.fdgCalculator = new FDGCalculator();
        this.fdgCalculator.init(this.WIDTH, this.HEIGHT);

        this.gradientInterpolator = new GradientInterpolator();
        this.gradientInterpolator.init(this.WIDTH, this.HEIGHT);

        this.heightMapRenderer = new HeightMapRenderer();
        this.heightMapRenderer.init(10, 10, 1024,  1024, this.WIDTH, this.HEIGHT);

        this.fdgDebugRenderer = new FDGDebugRenderer();
        this.fdgDebugRenderer.init(this.fdgBuffers);

        const aspect = canvas.width / canvas.height;
        this.perspective = mat4.perspective(mat4.create(), 70, aspect, 0.1, 30);

        // create frameBuffer to read from texture
        this.frameBuffer = gl.createFramebuffer();

        this.initGUI();

        gl.enable(gl.DEPTH_TEST);
        gl.depthFunc(gl.LEQUAL);

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
            RenderMode.All,
            RenderMode.Dilate,
            RenderMode.Push,
            RenderMode.Pull,
            RenderMode.Density,
            RenderMode.Scene3D,
            RenderMode.FDGDebug
        ]);
        gui.add(this.settings, 'logDensity');

        gui.add(this.settings, 'height', 0, 5);
        gui.add(this.settings, 'updateGraph');

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
        const output = this.fdgCalculator.getDMC().getTexture(iteration);

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

        if (this.settings.updateGraph) {
            this.fdgCalculator.updatePositions(this.fdgBuffers);
            this.dilateOut = this.dilator.dilate(this.fdgBuffers.numSamples, this.fdgBuffers.positionBuffer, this.fdgBuffers.valuesBuffer);
            this.heightMap = this.gradientInterpolator.calculateGradient(this.dilateOut);
            //this.needsUpdate = false;
        }

        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        gl.clearDepth(1.0);

        switch (this.settings.mode) {
            case RenderMode.Push: {
                this.renderPush();
                break;
            }

            case RenderMode.Pull: {
                this.renderPull();
                break;
            }

            case RenderMode.Dilate: {
                this.renderDilate();
                break;
            }

            case RenderMode.Scene3D: {
                this.render3d(deltaTime);
                break;
            }

            case RenderMode.Density: {
                this.renderDensity();
                break;
            }

            case RenderMode.All: {
                //this.renderDilate(0,0, this.CANVAS_WIDTH/2,this.CANVAS_HEIGHT/2)
                this.renderDensity(0, 0, this.CANVAS_WIDTH / 2, this.CANVAS_HEIGHT / 2);
                this.renderPush(0, this.CANVAS_HEIGHT / 2, this.CANVAS_WIDTH / 2, this.CANVAS_HEIGHT);
                this.renderPull(this.CANVAS_WIDTH / 2, this.CANVAS_HEIGHT / 2, this.CANVAS_WIDTH, this.CANVAS_HEIGHT);
                this.render3d(deltaTime, this.CANVAS_WIDTH / 2, 0, this.CANVAS_WIDTH / 2, this.CANVAS_HEIGHT / 2);
                break;
            }

            case RenderMode.FDGDebug: {
                gl.viewport(0, 0, this.WIDTH, this.HEIGHT);
                this.fdgDebugRenderer.drawDebugInfo(this.WIDTH , this.HEIGHT);
            }
        }
    }
}
