import { mat4, vec2, vec3 } from "gl-matrix";
import { ComputeGLApplication } from "../engine/application/ComputeGLApplication";
import { canvas, gl } from "../engine/Context";
import { TPAssert } from "../engine/error/TPException";
import { Profiler } from "../engine/Profiler";
import { FamilyGraph } from "../gedcom/FamilyGraph";
import { FamilyGraphData } from "../gedcom/FamilyGraphData";
import { FDGBuffers } from "../objects/FDGBuffers";
import { FDGCalculator } from "../objects/FDGCalculator";
import { FDGDebugRenderer } from "../objects/FDGDebugRenderer";
import { GradientInterpolator } from "../objects/GradientInterpolator";
import { HeightMapRenderer } from "../objects/HeightMapRenderer";
import { Transformer } from "../objects/Transformer";
import { AppSettings, RenderMode } from "./AppSettings";
import { ConstraintEngine } from "../objects/ConstraintEngine";
import { AppGUI } from "./AppGUI";

export class ComputeApplication extends ComputeGLApplication {
  forceFullscreen = true;
  CANVAS_WIDTH = 1024;
  CANVAS_HEIGHT = 1024;

  WIDTH: number;
  HEIGHT: number;

  familyGraph: FamilyGraph;
  graphData: FamilyGraphData;

  fdgBuffers: FDGBuffers;
  fdgCalculator: FDGCalculator;
  constraintEngine: ConstraintEngine;
  gradientInterpolator: GradientInterpolator;

  dilateOut: WebGLTexture;
  heightMap: WebGLTexture;

  frameBuffer: WebGLFramebuffer;

  modelRotationY: number = 0;
  modelRotationX: number = 30;
  distanceCamera: number = 15;

  mouseDragging = false;
  lastMouseMove: vec2;

  heightMapRenderer: HeightMapRenderer;
  fdgDebugRenderer: FDGDebugRenderer;

  transformer: Transformer;

  perspective: mat4;

  fpsDisplayer: HTMLSpanElement;

  initialized: boolean = false;
  lastColorRampUrl: string = null;

  gui: AppGUI = null;

  start(): void {
    super.start({ antialias: false });
    this.setStartLoopManually(true);
    this.loadInitialGraphData();
  }

  loadInitialGraphData() {
    // Load initial Gedcom file
    const xhttp = new XMLHttpRequest();
    xhttp.open("GET", "/gedcom/default.ged");
    xhttp.send();
    const app = this;
    xhttp.onload = e => {
      app.onInputChanged(xhttp.responseText);
    };
  }

  onStart(): void {
    const ext = gl.getExtension("EXT_color_buffer_float");
    TPAssert(ext != null, "Cannot render to floating point FBOs!");

    if (this.forceFullscreen) {
      this.CANVAS_WIDTH =
        window.innerWidth ||
        document.documentElement.clientWidth ||
        document.body.clientWidth;
      this.CANVAS_HEIGHT =
        window.innerHeight ||
        document.documentElement.clientHeight ||
        document.body.clientHeight;
    }

    canvas.width = this.CANVAS_WIDTH;
    canvas.height = this.CANVAS_HEIGHT;
    gl.viewport(0, 0, this.CANVAS_WIDTH, this.CANVAS_HEIGHT);
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    canvas.style.backgroundColor = "black";

    this.fpsDisplayer = <HTMLSpanElement>document.getElementById("fps");
    window.setInterval(e => {
      this.displayFPS();
    }, 500);

    this.gui = new AppGUI();
    this.gui.init(this.initApp.bind(this), this.onInputChanged.bind(this), this.onColorRampChanged.bind(this));

    this.initControlls();

    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);
  }

  onColorRampChanged(url: string) {
    if(this.heightMapRenderer) {
      this.heightMapRenderer.setColorRamp(url);
    }
  }

  onInputChanged(input: string) {
    this.familyGraph = new FamilyGraph();
    this.familyGraph.loadGedcom(input);
    this.familyGraph.estimateMissingDates(20);
    this.graphData = new FamilyGraphData(this.familyGraph);

    console.log(`Loaded GraphData with ${this.graphData.getCount()} entries.`);
    this.initApp();
  }

  initApp() {
    Profiler.startSession("InitApp");

    this.WIDTH = AppSettings.resolution;
    this.HEIGHT = AppSettings.resolution;

    this.fdgBuffers = new FDGBuffers();
    this.fdgBuffers.init(this.WIDTH, this.HEIGHT, this.graphData);

    this.constraintEngine = new ConstraintEngine();
    this.constraintEngine.init(this.WIDTH, this.HEIGHT);

    this.fdgCalculator = new FDGCalculator();
    this.fdgCalculator.init(this.WIDTH, this.HEIGHT);

    Profiler.startSession("Gradient Interpolator");
    this.gradientInterpolator = new GradientInterpolator();
    this.gradientInterpolator.init(this.WIDTH, this.HEIGHT);
    Profiler.stopSession();

    this.heightMapRenderer = new HeightMapRenderer();
    this.heightMapRenderer.init(
      10,
      10,
      AppSettings.heightMapResolution,
      AppSettings.heightMapResolution,
      this.WIDTH,
      this.HEIGHT,
      this.graphData
    );

    this.fdgDebugRenderer = new FDGDebugRenderer();
    this.fdgDebugRenderer.init(this.fdgBuffers);

    this.transformer = new Transformer();
    this.transformer.init(this.WIDTH, this.HEIGHT);

    const aspect = canvas.width / canvas.height;
    this.perspective = mat4.perspective(mat4.create(), 70, aspect, 0.1, 30);

    // create frameBuffer to read from texture
    this.frameBuffer = gl.createFramebuffer();
    this.initialized = true;
    Profiler.stopSession();
    Profiler.printTree();
  }

  renderPush(
    x: number = 0,
    y: number = 0,
    width: number = this.CANVAS_WIDTH,
    height: number = this.CANVAS_HEIGHT
  ) {
    gl.bindFramebuffer(gl.READ_FRAMEBUFFER, this.frameBuffer);

    const iteration = AppSettings.pushIteration;
    const index = iteration - 1;
    const output = this.gradientInterpolator.getPushTexture(index);
    const fraction = 2 ** iteration;

    gl.framebufferTexture2D(
      gl.READ_FRAMEBUFFER,
      gl.COLOR_ATTACHMENT0,
      gl.TEXTURE_2D,
      output,
      0
    );
    gl.blitFramebuffer(
      0,
      0,
      this.WIDTH / fraction,
      this.HEIGHT / fraction,
      x,
      y,
      width,
      height,
      gl.COLOR_BUFFER_BIT,
      gl.NEAREST
    );
  }

  renderPull(
    x: number = 0,
    y: number = 0,
    width: number = this.CANVAS_WIDTH,
    height: number = this.CANVAS_HEIGHT
  ) {
    gl.bindFramebuffer(gl.READ_FRAMEBUFFER, this.frameBuffer);

    const iteration = AppSettings.pullIteration;
    const index = iteration - 1;
    const output = this.gradientInterpolator.getPullTexture(index);
    const w = 2 ** iteration;
    const h = 2 ** iteration;

    gl.framebufferTexture2D(
      gl.READ_FRAMEBUFFER,
      gl.COLOR_ATTACHMENT0,
      gl.TEXTURE_2D,
      output,
      0
    );
    gl.blitFramebuffer(
      0,
      0,
      w,
      h,
      x,
      y,
      width,
      height,
      gl.COLOR_BUFFER_BIT,
      gl.NEAREST
    );
  }

  renderDilate(
    x: number = 0,
    y: number = 0,
    width: number = this.CANVAS_WIDTH,
    height: number = this.CANVAS_HEIGHT
  ) {
    gl.bindFramebuffer(gl.READ_FRAMEBUFFER, this.frameBuffer);
    gl.framebufferTexture2D(
      gl.READ_FRAMEBUFFER,
      gl.COLOR_ATTACHMENT0,
      gl.TEXTURE_2D,
      this.dilateOut,
      0
    );
    gl.blitFramebuffer(
      0,
      0,
      this.WIDTH,
      this.HEIGHT,
      x,
      y,
      width,
      height,
      gl.COLOR_BUFFER_BIT,
      gl.NEAREST
    );
  }

  renderDensity(
    x: number = 0,
    y: number = 0,
    width: number = this.CANVAS_WIDTH,
    height: number = this.CANVAS_HEIGHT
  ) {
    gl.bindFramebuffer(gl.READ_FRAMEBUFFER, this.frameBuffer);

    const iteration = AppSettings.densityIteration;
    const output = this.fdgCalculator.getDMC().getTexture(iteration);

    const fraction = 2 ** iteration;

    const w = this.WIDTH / fraction;
    const h = this.HEIGHT / fraction;

    gl.framebufferTexture2D(
      gl.READ_FRAMEBUFFER,
      gl.COLOR_ATTACHMENT0,
      gl.TEXTURE_2D,
      output.texture,
      0
    );
    gl.blitFramebuffer(
      0,
      0,
      w,
      h,
      x,
      y,
      width,
      height,
      gl.COLOR_BUFFER_BIT,
      gl.NEAREST
    );

    if (AppSettings.logDensity) {
      const pixels = new Float32Array(w * h);
      gl.readPixels(0, 0, w, h, gl.RED, gl.FLOAT, pixels);
      console.log(pixels);
    }
  }

  render3d(
    deltaTime: number,
    x: number = 0,
    y: number = 0,
    width: number = this.CANVAS_WIDTH,
    height: number = this.CANVAS_HEIGHT
  ) {
    gl.bindFramebuffer(gl.READ_FRAMEBUFFER, null);

    gl.viewport(x, y, width, height);


    //this.modelRotationY += 5 * deltaTime;

    const rotationY = mat4.rotateY(
      mat4.create(),
      mat4.identity(mat4.create()),
      (this.modelRotationY / 180) * Math.PI
    );
    const rotationX = mat4.rotateX(
      mat4.create(),
      mat4.identity(mat4.create()),
      (this.modelRotationX / 180) * Math.PI
    );
    const model = mat4.mul(mat4.create(), rotationX, rotationY);
    const view = mat4.translate(
      mat4.create(),
      mat4.create(),
      vec3.fromValues(0, 0, -this.distanceCamera)
    );

    this.heightMapRenderer.draw(
      this.fdgBuffers,
      this.heightMap,
      AppSettings.heightMapFactor,
      model,
      view,
      this.perspective,
      AppSettings.useLights,
      AppSettings.showPerson,
      AppSettings.wireframe
    );
  }

  onUpdate(deltaTime: number): void {
    if (!this.initialized) {
      return;
    }

    if (AppSettings.updateGraph) {
      for (let i = 0; i < AppSettings.numUpdates; i++) {
        this.fdgCalculator.updatePositions(this.fdgBuffers);
      }
      this.dilateOut = this.constraintEngine.renderConstraints(
        AppSettings.dilateRadius,
        this.fdgBuffers.numSamples,
        this.fdgBuffers.positionBuffer,
        this.fdgBuffers.valuesBuffer,
        this.fdgBuffers.edgeIndexBuffer,
        this.fdgBuffers.edgeIndiciesCount
      );
      const gradient = this.gradientInterpolator.calculateGradient(
        this.dilateOut
      );
      this.heightMap = gradient;
      if (AppSettings.mode == RenderMode.Scene3DFlat) {
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
        this.renderPush(
          0,
          this.CANVAS_HEIGHT / 2,
          this.CANVAS_WIDTH / 2,
          this.CANVAS_HEIGHT
        );
        this.renderPull(
          this.CANVAS_WIDTH / 2,
          this.CANVAS_HEIGHT / 2,
          this.CANVAS_WIDTH,
          this.CANVAS_HEIGHT
        );
        this.render3d(
          deltaTime,
          this.CANVAS_WIDTH / 2,
          0,
          this.CANVAS_WIDTH / 2,
          this.CANVAS_HEIGHT / 2
        );
        break;
      }

      case RenderMode.FDGDebug: {
        gl.viewport(0, 0, this.CANVAS_WIDTH, this.CANVAS_HEIGHT);
        this.fdgDebugRenderer.drawDebugInfo(this.WIDTH, this.HEIGHT);
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
    canvas.addEventListener("mousedown", e => {
      if (
        [RenderMode.Scene3D, RenderMode.Scene3DFlat, RenderMode.All].includes(
          AppSettings.mode
        )
      ) {
        this.mouseDragging = true;
        this.lastMouseMove = vec2.fromValues(e.x, e.y);
      }
    });

    canvas.addEventListener("mouseup", e => {
      this.mouseDragging = false;
    });

    canvas.addEventListener("mousemove", e => {
      if (this.mouseDragging) {
        const pos = vec2.fromValues(e.x, e.y);
        const delta = vec2.sub(vec2.create(), pos, this.lastMouseMove);
        this.lastMouseMove = pos;
        this.modelRotationX = this.clamp(this.modelRotationX + delta[1], 0, 90);
        this.modelRotationY += delta[0];
      }
    });

    canvas.addEventListener("wheel", e => {
      if (
        [RenderMode.Scene3D, RenderMode.Scene3DFlat, RenderMode.All].includes(
          AppSettings.mode
        )
      ) {
        const direction = Math.sign(e.deltaY);
        this.distanceCamera = this.clamp(
          this.distanceCamera + direction,
          5,
          30
        );
      }
    });
  }
}
