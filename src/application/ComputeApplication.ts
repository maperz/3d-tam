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
import {Transformer} from '../objects/Transformer';
import {AppSettings, RenderMode} from './AppSettings';

export class ComputeApplication extends ComputeGLApplication {

    readonly CANVAS_WIDTH = 1024;
    readonly CANVAS_HEIGHT = 1024;

    readonly WIDTH = 2048;
    readonly HEIGHT = 2048;

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
    modelRotationX: number = 30;
    distanceCamera: number = 15;

    mouseDragging = false;
    lastMouseMove : vec2;

    heightMapRenderer: HeightMapRenderer;
    fdgDebugRenderer: FDGDebugRenderer;

    transformer: Transformer;

    perspective: mat4;

    fpsDisplayer: HTMLSpanElement;

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

        this.fpsDisplayer = <HTMLSpanElement>document.getElementById('fps');
        window.setInterval(e => {
            this.displayFPS();
        }, 500);

        this.loadGraphData();

        this.initGUI();
        this.initControlls();

        gl.enable(gl.DEPTH_TEST);
        gl.depthFunc(gl.LEQUAL);

        this.initApp();
    }

    initApp() {

        this.fdgBuffers = new FDGBuffers();
        this.fdgBuffers.init(this.WIDTH, this.HEIGHT, this.graphData);

        this.dilator = new Dilator();
        this.dilator.init(this.WIDTH, this.HEIGHT, this.DILATE_RADIUS);

        this.fdgCalculator = new FDGCalculator();
        this.fdgCalculator.init(this.WIDTH, this.HEIGHT);

        this.gradientInterpolator = new GradientInterpolator();
        this.gradientInterpolator.init(this.WIDTH, this.HEIGHT);

        this.heightMapRenderer = new HeightMapRenderer();
        this.heightMapRenderer.init(10, 10, 128,  128, this.WIDTH, this.HEIGHT);

        this.fdgDebugRenderer = new FDGDebugRenderer();
        this.fdgDebugRenderer.init(this.fdgBuffers);

        this.transformer = new Transformer();
        this.transformer.init(this.WIDTH, this.HEIGHT);

        const aspect = canvas.width / canvas.height;
        this.perspective = mat4.perspective(mat4.create(), 70, aspect, 0.1, 30);

        // create frameBuffer to read from texture
        this.frameBuffer = gl.createFramebuffer();
    }

    initGUI(): void {
        const gui: GUI = new GUI({width: 300});

        gui.useLocalStorage = true;
        gui.remember(AppSettings);
        gui.add(AppSettings, 'mode', [
            RenderMode.All,
            RenderMode.Dilate,
            RenderMode.Push,
            RenderMode.Pull,
            RenderMode.Density,
            RenderMode.Scene3D,
            RenderMode.Scene3DFlat,
            RenderMode.FDGDebug,
        ]).name('Render Mode');
        const iterations = [];
        for (let iteration = 1; iteration <= Math.log2(this.WIDTH); iteration++) {
            iterations.push(iteration);
        }
        gui.add(AppSettings, 'pushIteration', iterations).name('Push Iteration');
        gui.add(AppSettings, 'pullIteration', iterations).name('Pull Iteration');
        // TODO: Change items to something relative to iterations
        gui.add(AppSettings, 'densityIteration', [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]).name('Density Iteration');

        gui.add(AppSettings, 'logDensity').name('Log Density')
        gui.add(AppSettings, 'heightMapFactor', 1, 5, 0.2).name('Height');
        gui.add(AppSettings, 'updateGraph').name('Update Graph');
        gui.add(AppSettings, 'showPerson').name('Show Person');

        gui.add(AppSettings, 'attraction_stiffness').name('Attraction Stiffness');
        gui.add(AppSettings, 'attraction_length', 0.1).name('Attraction Length');


        gui.add(AppSettings, 'gravity_x', 0, 10, 0.01).name('GravityX');
        gui.add(AppSettings, 'gravity_y', 0, 10, 0.01).name('GravityY');
        gui.add(AppSettings, 'numUpdates', 0, 1000, 1).name('Number of updates');

        const restartObject = {Restart: () => { this.initApp(); }};
        const fileLoader = {
            loadFile : () => {
                document.getElementById('upload').click();
            }
        };

        const app = this;
        function readSingleFile(e) {
            const file = e.target.files[0];
            if (!file) {
                return;
            }
            const reader = new FileReader();
            reader.onload = e => {
                const contents = String(reader.result);
                (<HTMLScriptElement>document.getElementById('gedcom')).text = contents;
                app.loadGraphData();
                app.initApp();
            };
            reader.readAsText(file);
        }

        document.getElementById('upload')
            .addEventListener('change', readSingleFile, false);

        gui.add(fileLoader, 'loadFile').name('Load GED file');
        gui.add(restartObject,'Restart');
    }

    renderPush(x: number = 0, y: number = 0, width: number = this.CANVAS_WIDTH, height: number = this.CANVAS_HEIGHT) {
        gl.bindFramebuffer(gl.READ_FRAMEBUFFER, this.frameBuffer);

        const iteration = AppSettings.pushIteration;
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

        const iteration = AppSettings.pullIteration;
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

        const iteration = AppSettings.densityIteration;
        const output = this.fdgCalculator.getDMC().getTexture(iteration);

        const fraction = 2 ** iteration;

        const w = this.WIDTH / fraction;
        const h = this.HEIGHT / fraction;

        gl.framebufferTexture2D(gl.READ_FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, output.texture, 0);
        gl.blitFramebuffer(
            0, 0, w, h,
            x, y, width, height, gl.COLOR_BUFFER_BIT, gl.NEAREST);

        if (AppSettings.logDensity) {
            const pixels = new Float32Array(w * h );
            gl.readPixels(0, 0, w, h, gl.RED, gl.FLOAT, pixels);
            console.log(pixels);
        }
    }

    render3d(deltaTime: number, x: number = 0, y: number = 0, width: number = this.CANVAS_WIDTH, height: number = this.CANVAS_HEIGHT) {
        gl.bindFramebuffer(gl.READ_FRAMEBUFFER, null);

        gl.viewport(x, y, width, height);

        //this.modelRotationY += 5 * deltaTime;

        const rotationY = mat4.rotateY(mat4.create(), mat4.identity(mat4.create()), this.modelRotationY / 180 * Math.PI);
        const rotationX = mat4.rotateX(mat4.create(), mat4.identity(mat4.create()), this.modelRotationX / 180 * Math.PI);
        const model = mat4.mul(mat4.create(), rotationX, rotationY);
        const view = mat4.translate(mat4.create(), mat4.create(), vec3.fromValues(0, 0, -this.distanceCamera));

        this.heightMapRenderer.drawWireFrame(this.fdgBuffers, this.heightMap, AppSettings.heightMapFactor, model, view, this.perspective, AppSettings.showPerson);
    }

    onUpdate(deltaTime: number): void {
        if (AppSettings.updateGraph) {
            for(let i = 0; i < AppSettings.numUpdates; i++){
                this.fdgCalculator.updatePositions(this.fdgBuffers);
            }
            this.dilateOut = this.dilator.dilate(this.fdgBuffers.numSamples, this.fdgBuffers.positionBuffer, this.fdgBuffers.valuesBuffer);
            const gradient = this.gradientInterpolator.calculateGradient(this.dilateOut);
            this.heightMap = gradient;
            if(AppSettings.mode == RenderMode.Scene3DFlat) {
                this.heightMap = this.transformer.transform(gradient);
            }
            //this.needsUpdate = false;
        }

        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        gl.clearDepth(1.0);

        switch (AppSettings.mode) {
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

            case RenderMode.Scene3D:
            case RenderMode.Scene3DFlat: {
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

    private displayFPS() {
        this.fpsDisplayer.innerText = String(this.fps);
    }

    private clamp(value: number, min: number, max: number) {
        return Math.min(max, Math.max(min, value));
    }

    private initControlls() {

        canvas.addEventListener('mousedown', e => {
            if([RenderMode.Scene3D, RenderMode.Scene3DFlat, RenderMode.All].includes(AppSettings.mode)) {
                this.mouseDragging = true;
                this.lastMouseMove = vec2.fromValues(e.x, e.y);
            }
        });

        canvas.addEventListener('mouseup', e => {
            this.mouseDragging = false;
        });

        canvas.addEventListener('mousemove', e => {
            if(this.mouseDragging) {
                const pos = vec2.fromValues(e.x, e.y);
                const delta = vec2.sub(vec2.create(), pos, this.lastMouseMove);
                this.lastMouseMove = pos;
                this.modelRotationX = this.clamp(this.modelRotationX + delta[1], 0, 90);
                this.modelRotationY += delta[0];
            }
        });

        canvas.addEventListener('wheel', e => {
            if([RenderMode.Scene3D, RenderMode.Scene3DFlat, RenderMode.All].includes(AppSettings.mode)) {
                const direction = Math.sign(e.deltaY);
                this.distanceCamera = this.clamp(this.distanceCamera + direction, 5, 30);
            }
        });
    }
}
