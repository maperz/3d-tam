import { mat4, vec2, vec3, vec4 } from "gl-matrix";
import { ComputeGLApplication } from "../engine/application/ComputeGLApplication";
import { canvas, gl } from "../engine/Context";
import { TPAssert } from "../engine/error/TPException";
import { Profiler } from "../engine/Profiler";
import { FamilyGraph } from "../gedcom/FamilyGraph";
import { FamilyGraphData } from "../gedcom/FamilyGraphData";
import { DataBuffers } from "../objects/DataBuffers";
import { SimulationEngine } from "../objects/SimulationEngine";
import { FDGDebugRenderer } from "../objects/FDGDebugRenderer";
import { GradientInterpolator } from "../objects/GradientInterpolator";
import { HeightMapRenderer } from "../objects/HeightMapRenderer";
import { Transformer } from "../objects/Transformer";
import { AppSettings, RenderMode } from "./AppSettings";
import { ConstraintEngine } from "../objects/ConstraintEngine";
import { AppGUI } from "./AppGUI";
import { Recorder } from "../engine/Recorder";

export class ComputeApplication extends ComputeGLApplication {
  forceFullscreen = true;
  CANVAS_WIDTH = 1024;
  CANVAS_HEIGHT = 1024;

  WIDTH: number;
  HEIGHT: number;

  familyGraph: FamilyGraph;
  graphData: FamilyGraphData;

  fdgBuffers: DataBuffers;
  simuEngine: SimulationEngine;
  constraintEngine: ConstraintEngine;
  gradientInterpolator: GradientInterpolator;

  dilateOut: WebGLTexture;
  heightMap: WebGLTexture;

  frameBuffer: WebGLFramebuffer;

  modelRotationY: number = 0;
  modelRotationX: number = 30;
  distanceCamera: number = 15;

  mouseDragging = false;
  lastMouseMove = vec2.create();

  heightMapRenderer: HeightMapRenderer;
  fdgDebugRenderer: FDGDebugRenderer;

  transformer: Transformer;
  recorder: Recorder;

  perspective: mat4;
  view: mat4;
  model: mat4;

  area: mat4 = mat4.identity(mat4.create());

  fpsDisplayer: HTMLSpanElement;

  initialized: boolean = false;
  lastColorRampUrl: string = null;

  private heightmapModelWidth = 20;
  private heightmapModelHeight = 20;

  private tooltip: HTMLDivElement;
  private selectedPerson: number = null;
  private grabbedPerson: number = null;
  private grabPoint: vec2 = null;

  private canvas2d: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;

  gui: AppGUI = null;

  start(): void {
    super.start({ antialias: false, preserveDrawingBuffer: true });
    this.setStartLoopManually(true);
    this.loadInitialGraphData();
  }

  loadInitialGraphData() {
    // Load initial Gedcom file
    const xhttp = new XMLHttpRequest();
    xhttp.open("GET", "/gedcom/default.ged");
    xhttp.send();
    const app = this;
    xhttp.onload = (e) => {
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

    this.canvas2d = document.getElementById("canvas-2d") as HTMLCanvasElement;
    this.ctx = this.canvas2d.getContext("2d");
    this.canvas2d.width = canvas.width;
    this.canvas2d.height = canvas.height;

    gl.viewport(0, 0, this.CANVAS_WIDTH, this.CANVAS_HEIGHT);
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    canvas.style.backgroundColor = "black";

    this.tooltip = <HTMLDivElement>document.getElementById("info-tooltip");
    this.tooltip.style.visibility = "hidden";

    this.fpsDisplayer = <HTMLSpanElement>document.getElementById("fps");
    window.setInterval((e) => {
      this.displayFPS();
    }, 500);

    this.gui = new AppGUI();
    this.gui.init(
      this.initApp.bind(this),
      this.onInputChanged.bind(this),
      this.onColorRampChanged.bind(this)
    );

    this.initControlls();

    this.recorder = new Recorder();
    this.recorder.init();

    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);
  }

  onColorRampChanged(url: string) {
    if (this.heightMapRenderer) {
      this.heightMapRenderer.setColorRamp(url);
    }
  }

  onInputChanged(input: string) {
    this.familyGraph = new FamilyGraph();
    this.familyGraph.loadGedcom(input);
    this.familyGraph.estimateMissingDates(20);
    Profiler.startSession("Family Graph Data");
    this.graphData = new FamilyGraphData(this.familyGraph);
    Profiler.stopSession();

    console.log(`Loaded GraphData with ${this.graphData.getCount()} entries.`);
    this.initApp();
  }

  initApp() {
    Profiler.startSession("InitApp");

    this.WIDTH = AppSettings.resolution;
    this.HEIGHT = AppSettings.resolution;

    this.fdgBuffers = new DataBuffers();
    this.fdgBuffers.init(this.WIDTH, this.HEIGHT, this.graphData);

    this.constraintEngine = new ConstraintEngine();
    this.constraintEngine.init(this.WIDTH, this.HEIGHT);

    this.simuEngine = new SimulationEngine();
    this.simuEngine.init(this.WIDTH, this.HEIGHT);

    Profiler.startSession("Gradient Interpolator");
    this.gradientInterpolator = new GradientInterpolator();
    this.gradientInterpolator.init(this.WIDTH, this.HEIGHT);
    Profiler.stopSession();

    this.heightMapRenderer = new HeightMapRenderer();
    this.heightMapRenderer.init(
      this.heightmapModelWidth,
      this.heightmapModelHeight,
      AppSettings.heightMapResolution,
      AppSettings.heightMapResolution,
      this.WIDTH,
      this.HEIGHT
    );

    this.fdgDebugRenderer = new FDGDebugRenderer();
    this.fdgDebugRenderer.init(this.fdgBuffers);

    this.transformer = new Transformer();
    this.transformer.init(this.WIDTH, this.HEIGHT);

    const aspect = canvas.width / canvas.height;
    this.perspective = mat4.perspective(mat4.create(), 70, aspect, 0.1, 50);

    this.recalculateViewMat();
    this.recalculateModelMat();

    // create frameBuffer to read from texture
    this.frameBuffer = gl.createFramebuffer();

    this.initialized = true;
    Profiler.stopSession();
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

  renderConstraint(
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

    const fraction = 2 ** iteration;

    const w = this.WIDTH / fraction;
    const h = this.HEIGHT / fraction;

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

    this.heightMapRenderer.draw(
      this.fdgBuffers,
      this.heightMap,
      AppSettings.heightMapFactor,
      this.model,
      this.view,
      this.perspective,
      this.area,
      AppSettings.useLights,
      AppSettings.wireframe
    );
    this.drawOverlay();
  }

  onUpdate(deltaTime: number): void {
    if (!this.initialized) {
      return;
    }

    if (AppSettings.updateGraph) {
      for (let i = 0; i < AppSettings.numUpdates; i++) {
        this.simuEngine.updatePositions(
          this.fdgBuffers,
          this.grabbedPerson,
          this.grabPoint
        );
      }

      const boundary = this.simuEngine.getBoundaries(this.fdgBuffers);

      const length = Math.abs(boundary[2] - boundary[0]);
      const height =  Math.abs(boundary[3] - boundary[1]);


      //const centerX = boundary[0] + (boundary[2] - boundary[0]) / 2;
      //const centerY = boundary[1] + (boundary[3] - boundary[1]) / 2;
      //console.log(centerX, centerY)

      const factor = Math.max(length, height);

      this.area[0] =  512 / factor;
      this.area[10] = 512 / factor;
      
    }
    this.dilateOut = this.constraintEngine.renderConstraints(
      AppSettings.dilateRadius,
      this.fdgBuffers.numSamples,
      this.fdgBuffers.positionBuffer,
      this.fdgBuffers.valuesBuffer,
      this.fdgBuffers.edgeIndexBuffer,
      this.fdgBuffers.edgeIndiciesCount,
      this.area
    );
    const gradient = this.gradientInterpolator.calculateGradient(
      this.dilateOut
    );
    this.heightMap = gradient;
    if (AppSettings.mode == RenderMode.Scene3DFlat) {
      this.heightMap = this.transformer.transform(gradient);
    }
    //this.needsUpdate = false;

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

      case RenderMode.Constraint: {
        this.renderConstraint();
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
        this.renderConstraint(
          0,
          0,
          this.CANVAS_WIDTH / 2,
          this.CANVAS_HEIGHT / 2
        );
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

  private recalculateViewMat() {
    this.view = mat4.translate(
      mat4.create(),
      mat4.create(),
      vec3.fromValues(0, 0, -this.distanceCamera)
    );
  }

  private recalculateModelMat() {
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
    this.model = mat4.mul(mat4.create(), rotationX, rotationY);
  }

  private displayFPS() {
    this.fpsDisplayer.innerText = String(this.fps);
  }

  private clamp(value: number, min: number, max: number) {
    return Math.min(max, Math.max(min, value));
  }

  private initControlls() {
    canvas.addEventListener("mousedown", (e) => {
      if (
        [RenderMode.Scene3D, RenderMode.Scene3DFlat, RenderMode.All].includes(
          AppSettings.mode
        )
      ) {
        this.mouseDragging = true;
        this.lastMouseMove = vec2.fromValues(e.x, e.y);
        if (this.selectedPerson != null) {
          this.grabbedPerson = this.selectedPerson;
          this.grabPoint = null;
        }
        canvas.style.cursor = this.selectedPerson ? "grabbing" : "move";
      }
    });

    canvas.addEventListener("mouseup", (e) => {
      this.mouseDragging = false;
      canvas.style.cursor = "";
      this.tooltip.style.visibility = "hidden";
      this.grabbedPerson = null;
    });

    canvas.addEventListener("mousemove", (e) => {
      if (
        [RenderMode.Scene3D, RenderMode.Scene3DFlat, RenderMode.All].includes(
          AppSettings.mode
        )
      ) {
        const pos = vec2.fromValues(e.x, e.y);
        const delta = vec2.sub(vec2.create(), pos, this.lastMouseMove);
        this.lastMouseMove = pos;

        if (this.mouseDragging && this.selectedPerson == null) {
          this.modelRotationX = this.clamp(
            this.modelRotationX + delta[1],
            0,
            90
          );
          this.modelRotationY += delta[0];
          this.recalculateModelMat();
        }

        if (this.mouseDragging && this.grabbedPerson != null) {
          this.grabPoint = this.getGrabPoint(
            this.getRay(e.x, e.y),
            this.graphData.getValue(this.grabbedPerson)
          );
          this.tooltip.style.visibility = "hidden";
        }

        if (!this.mouseDragging && this.heightMapRenderer) {
          this.selectedPerson = this.heightMapRenderer.getPersonAt(
            e.x,
            canvas.height - e.y
          );
          this.heightMapRenderer.setSelectedPerson(this.selectedPerson);
          if (this.selectedPerson != null && this.selectedPerson >= 0) {
            canvas.style.cursor = "grab";
            const name = this.graphData.getName(this.selectedPerson);
            const date = this.graphData
              .getDate(this.selectedPerson)
              .getFullYear();
            this.tooltip.style.visibility = "";
            this.tooltip.style.top = (e.y + 10).toString() + "px";
            this.tooltip.style.left = (e.x + 10).toString() + "px";
            this.tooltip.innerText = `#${this.selectedPerson} ${name} [${date}]`;
            200;
          } else {
            canvas.style.cursor = "";
            this.tooltip.style.visibility = "hidden";
          }
        }
      }
    });

    canvas.addEventListener("wheel", (e) => {
      e.preventDefault();

      if (e.ctrlKey) {
        const direction = -Math.sign(e.deltaY);
        const val = 1 + direction * 0.1;
        this.area[0] *= val;
        this.area[10] *= val;
        this.area[15] = 1;
        return;
      }

      if (
        [RenderMode.Scene3D, RenderMode.Scene3DFlat, RenderMode.All].includes(
          AppSettings.mode
        )
      ) {
        const direction = Math.sign(e.deltaY);
        this.distanceCamera = this.clamp(
          this.distanceCamera + direction,
          2,
          25
        );
        this.recalculateViewMat();
      }
    });
  }

  getGrabPoint(ray: vec3, value: number): vec2 {
    const cam = vec4.fromValues(0, 0, this.distanceCamera, 1.0);

    const inverseModel = mat4.invert(mat4.create(), this.model);

    const cam4d = vec4.transformMat4(vec4.create(), cam, inverseModel);

    const cameraPosition = vec3.fromValues(cam4d[0], cam4d[1], cam4d[2]);
    const planePoint = vec3.fromValues(0, value, 0);

    // Ray intersection
    const diff = vec3.sub(vec3.create(), cameraPosition, planePoint);
    const prod1 = diff[1];
    const prod2 = ray[1];

    if (prod2 == 0) {
      // Prevent division by zero
      return null;
    }

    const prod3 = prod1 / prod2;

    const worldPoint = vec3.sub(
      vec3.create(),
      cameraPosition,
      vec3.scale(vec3.create(), ray, prod3)
    );

    let x = worldPoint[0] / this.heightmapModelWidth;
    let y = worldPoint[2] / this.heightmapModelHeight;

    //x = Math.max(-1, Math.min(1, x));
    //y = Math.max(-1, Math.min(1, y));

    return vec2.fromValues(
      (x * this.WIDTH) / this.area[0],
      (y * this.HEIGHT) / this.area[10]
    );
  }

  getRay(screenX: number, screenY: number): vec3 {
    // To NDC space
    const normX = (screenX * 2) / canvas.width - 1;
    const normY = ((canvas.height - screenY) * 2) / canvas.height - 1;
    const clipCoords = vec4.fromValues(normX, normY, -1, 1);

    // To view space
    const inversePerspective = mat4.invert(mat4.create(), this.perspective);
    const viewCoordsXY = vec4.transformMat4(
      vec4.create(),
      clipCoords,
      inversePerspective
    );
    const viewCoords = vec4.fromValues(viewCoordsXY[0], viewCoordsXY[1], -1, 0);

    // To world space
    const joinedView = mat4.multiply(mat4.create(), this.model, this.view);
    const inverseView = mat4.invert(mat4.create(), joinedView);
    const rayWorld = vec4.transformMat4(vec4.create(), viewCoords, inverseView);
    const ray = vec3.normalize(
      vec3.create(),
      vec3.fromValues(rayWorld[0], rayWorld[1], rayWorld[2])
    );
    return ray;
  }

  drawMinimap() {
    this.ctx.lineWidth = 2;

    let mmW = 160;
    let mmH = mmW * this.HEIGHT / this.WIDTH;
    let scopeX = 0 + mmW / 2;
    let scopeY = 0 + mmH / 2;

    let ssX = this.area[0];
    let ssY = this.area[10];
    
    const swapped = ssX < 1.0 || ssY < 1.0;

    if(Math.abs(1 - ssX) < 0.05 || Math.abs(1 - ssY) < 0.05) {
      return;
    }

    if (swapped) {
      ssX = 1 / ssX;
      ssY = 1 / ssY;
    }

    const scopeW = mmW / ssX;
    const scopeH = mmH / ssY;
    
    scopeX -= scopeW / 2;
    scopeY -= scopeH / 2;

    const colorMap = "red";
    const colorFrame = "white";

    this.ctx.strokeStyle = !swapped ? colorFrame : colorMap;
    this.ctx.beginPath();
    this.ctx.rect(20, 50, mmW, mmH);
    this.ctx.stroke();

    this.ctx.strokeStyle = swapped ? colorFrame : colorMap;
    this.ctx.beginPath();
    this.ctx.rect(20 + scopeX, 50 + scopeY, scopeW, scopeH);
    this.ctx.stroke();
  }

  drawOverlay() {
    this.ctx.clearRect(0, 0, canvas.width, canvas.height);
    this.drawMinimap();

    const fillStyle = "#0E0E0E";
    this.ctx.fillStyle = fillStyle;

    let data = this.heightMapRenderer.getData();
    if (data && this.graphData) {
      for (let id = 0; id < this.graphData.getCount(); id++) {
        const x = data[id * 2];
        const y = canvas.height - data[id * 2 + 1];
        const name = this.graphData.getName(id);

        if (id == this.heightMapRenderer.getSelectedPerson()) {
          this.ctx.fillStyle = "#FF00FF";
        }

        this.ctx.fillText(name, x + 5, y + 3);
        this.ctx.beginPath();
        this.ctx.ellipse(x, y, 3, 3, 0, 0, 2 * Math.PI);
        this.ctx.fill();

        if (id == this.heightMapRenderer.getSelectedPerson()) {
          this.ctx.fillStyle = fillStyle;
        }
      }
    }
  }
}
