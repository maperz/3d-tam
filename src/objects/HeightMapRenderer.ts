import { mat4 } from "gl-matrix";
import { AppSettings } from "../application/AppSettings";
import { canvas, gl } from "../engine/Context";
import { TPAssert } from "../engine/error/TPException";
import { Shader } from "../engine/Shader";
import { createShaderFromSources } from "../engine/utils/Utils";
import { PersonDebugShader } from "../shaders/debug/PersonDebugShader";
import { HeightMapShader } from "../shaders/heightmap/HeightMapShader";
import { FDGBuffers } from "./FDGBuffers";
import { NormalsCalculator } from "./NormalsCalculator";
import { PixelGrid } from "./PixelGrid";
import { FamilyGraphData } from "../gedcom/FamilyGraphData";

class ChunkDrawInfo {
  constructor(public vao: WebGLVertexArrayObject, public elements: number) {}
}

export class HeightMapRenderer {
  private shader: Shader;
  private personDebug: Shader;

  private chunkInfos: ChunkDrawInfo[];
  private pixelsX: number;
  private pixelsY: number;
  private width: number;
  private height: number;

  private cubeVAO: WebGLVertexArrayObject;

  private selectedId = -1;
  private normalsCalculator: NormalsCalculator;

  private cubeFramebuffer: WebGLFramebuffer;

  private tooltip: HTMLDivElement;

  private colorRampTexture: WebGLTexture;

  private useLightsLoc: WebGLUniformLocation;
  private colorRampLoc: WebGLUniformLocation;

  private createInstanceInfo() {
    const vao = gl.createVertexArray();
    gl.bindVertexArray(vao);

    // POSITION
    const vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, CUBEDATA, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);

    const indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, CUBEINDICES, gl.STATIC_DRAW);

    gl.bindVertexArray(null);

    this.cubeVAO = vao;
  }

  setColorRamp(url: string) {
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);

    const level = 0;
    const internalFormat = gl.RGBA;
    const width = 1;
    const height = 1;
    const border = 0;
    const srcFormat = gl.RGBA;
    const srcType = gl.UNSIGNED_BYTE;
    const pixel = new Uint8Array([0, 0, 0, 255]); // Black
    gl.texImage2D(
      gl.TEXTURE_2D,
      level,
      internalFormat,
      width,
      height,
      border,
      srcFormat,
      srcType,
      pixel
    );

    const image = new Image();
    image.onload = function() {
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texImage2D(
        gl.TEXTURE_2D,
        level,
        internalFormat,
        srcFormat,
        srcType,
        image
      );

      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      this.colorRampTexture = texture;
      gl.bindTexture(gl.TEXTURE_2D, null);
    }.bind(this);
    image.src = url;

    if (!this.colorRampTexture) {
      // Set this here on first time immediately
      this.colorRampTexture = texture;
    }
    gl.bindTexture(gl.TEXTURE_2D, null);
  }

  init(
    width: number,
    height: number,
    tilesX: number,
    tilesY: number,
    pixelsX: number,
    pixelsY: number,
    graphData: FamilyGraphData
  ) {
    this.width = width;
    this.height = height;

    this.pixelsX = pixelsX;
    this.pixelsY = pixelsY;

    this.shader = createShaderFromSources(HeightMapShader);
    this.personDebug = createShaderFromSources(PersonDebugShader);

    const grid = new PixelGrid(width, height, tilesX, tilesY);

    this.chunkInfos = new Array<ChunkDrawInfo>();

    const verticesData = grid.getVertices();
    const indicesData = grid.getIndices();
    const pixelData = grid.getPixels();

    for (let chunk = 0; chunk < grid.getChunkCount(); chunk++) {
      const vertices = verticesData[chunk];
      const indices = indicesData[chunk];
      const pixels = pixelData[chunk];
      const chunkInfo = this.createChunkInfo(vertices, indices, pixels);
      this.chunkInfos.push(chunkInfo);
    }

    this.normalsCalculator = new NormalsCalculator();
    this.normalsCalculator.init(
      tilesX,
      tilesY,
      pixelsX,
      pixelsY,
      width / tilesX,
      height / tilesY
    );

    this.createInstanceInfo();

    this.cubeFramebuffer = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.cubeFramebuffer);

    const fboTexture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, fboTexture);
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGBA,
      canvas.width,
      canvas.height,
      0,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      null
    );
    gl.framebufferTexture2D(
      gl.FRAMEBUFFER,
      gl.COLOR_ATTACHMENT0,
      gl.TEXTURE_2D,
      fboTexture,
      0
    );

    gl.bindTexture(gl.TEXTURE_2D, null);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);

    this.tooltip = <HTMLDivElement>document.getElementById("info-tooltip");
    this.tooltip.style.visibility = "hidden";

    canvas.addEventListener("mousemove", e => {
      if (AppSettings.showPerson) {
        const rgba = new Uint8Array(4);
        const x = e.x;
        const y = canvas.height - e.y;

        gl.bindFramebuffer(gl.READ_FRAMEBUFFER, this.cubeFramebuffer);
        gl.readPixels(x, y, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, rgba);
        gl.bindFramebuffer(gl.READ_FRAMEBUFFER, null);
        if (!rgba.every(v => v === 0)) {
          const id =
            rgba[0] + (rgba[1] << 8) + (rgba[2] << 16) + (rgba[3] << 24) - 1;
          this.selectedId = id;
          this.tooltip.style.visibility = "";
          this.tooltip.style.top = (e.y + 10).toString() + "px";
          this.tooltip.style.left = (e.x + 10).toString() + "px";
          this.tooltip.innerText =
            graphData.getName(id) + ` [${graphData.getDate(id).getFullYear()}]`;
        } else {
          this.selectedId = -1;
          this.tooltip.style.visibility = "hidden";
        }
      } else {
        this.selectedId = -1;
        this.tooltip.style.visibility = "hidden";
      }
    });

    this.setColorRamp(`images/${AppSettings.colorRamp}`);
    this.colorRampLoc = this.shader.getUniformLocation("u_colorRamp");
    this.useLightsLoc = this.shader.getUniformLocation("u_useLights");
  }

  draw(
    buffer: FDGBuffers,
    heightMapTexture: WebGLTexture,
    height: number,
    model: mat4,
    view: mat4,
    proj: mat4,
    useLights: boolean = false,
    renderPerson: boolean = false,
    wireframe: boolean = false
  ) {
    TPAssert(
      this.shader != null,
      "Shader == null! Forgot to init HeightMapRenderer?"
    );

    if (heightMapTexture) {
      this.normalsCalculator.calculateNormals(heightMapTexture, height);

      this.shader.use();

      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, this.colorRampTexture);
      gl.uniform1i(this.colorRampLoc, 0);

      gl.uniform1i(this.useLightsLoc, useLights ? 1 : 0);

      const modelMatrixLocation = this.shader.getUniformLocation("u_model");
      gl.uniformMatrix4fv(modelMatrixLocation, false, model);

      const viewMatrixLocation = this.shader.getUniformLocation("u_view");
      gl.uniformMatrix4fv(viewMatrixLocation, false, view);

      const projectionMatrixLocation = this.shader.getUniformLocation("u_proj");
      gl.uniformMatrix4fv(projectionMatrixLocation, false, proj);

      gl.bindImageTexture(
        0,
        heightMapTexture,
        0,
        false,
        0,
        gl.READ_ONLY,
        gl.R32F
      );

      const colorLocation = this.shader.getUniformLocation("u_color");
      gl.uniform4f(colorLocation, 1.0, 1.0, 1.0, 1.0);

      gl.uniform2f(
        this.shader.getUniformLocation("u_size"),
        this.pixelsX,
        this.pixelsY
      );

      const heightLocation = this.shader.getUniformLocation("u_height");
      gl.uniform1f(heightLocation, height);

      gl.bindBufferBase(
        gl.SHADER_STORAGE_BUFFER,
        0,
        this.normalsCalculator.getNormalsBuffer()
      );
      gl.uniform2f(
        this.shader.getUniformLocation("u_gridSize"),
        this.normalsCalculator.tilesX,
        this.normalsCalculator.tilesY
      );

      for (const chunkInfo of this.chunkInfos) {
        gl.bindVertexArray(chunkInfo.vao);
        gl.drawElements(
          wireframe ? gl.LINES : gl.TRIANGLES,
          chunkInfo.elements,
          gl.UNSIGNED_SHORT,
          0
        );
        gl.bindVertexArray(null);
      }

      gl.bindBufferBase(gl.SHADER_STORAGE_BUFFER, 0, null);

      gl.bindTexture(gl.TEXTURE_2D, null);

      this.shader.unuse();
    }

    if (renderPerson) {
      gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, this.cubeFramebuffer);
      const oldClearColor = gl.getParameter(gl.COLOR_CLEAR_VALUE);
      gl.clearColor(0.0, 0.0, 0.0, 0.0);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      this.renderPersonDebug(buffer, height, model, view, proj, true);
      gl.clearColor(oldClearColor[0], oldClearColor[1], oldClearColor[2], oldClearColor[3]);
      gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, null);
      this.renderPersonDebug(buffer, height, model, view, proj);
    }
  }

  private createChunkInfo(
    vertices: Float32Array,
    indices: Uint16Array,
    pixels: Float32Array
  ): ChunkDrawInfo {
    const vao = gl.createVertexArray();
    gl.bindVertexArray(vao);

    // POSITION
    const vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

    // INDEX
    const indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

    const elements = indices.length;

    // Pixels
    const pixelBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, pixelBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, pixels, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(1);
    gl.vertexAttribPointer(1, 2, gl.FLOAT, false, 0, 0);
    gl.bindVertexArray(null);

    return new ChunkDrawInfo(vao, elements);
  }

  public renderPersonDebug(
    buffers: FDGBuffers,
    height: number,
    model: mat4,
    view: mat4,
    proj: mat4,
    renderIds: boolean = false
  ) {
    this.personDebug.use();

    gl.bindBufferBase(gl.SHADER_STORAGE_BUFFER, 0, buffers.positionBuffer);
    gl.bindBufferBase(gl.SHADER_STORAGE_BUFFER, 1, buffers.valuesBuffer);

    const modelMatrixLocation = this.personDebug.getUniformLocation("u_model");
    gl.uniformMatrix4fv(modelMatrixLocation, false, model);

    const viewMatrixLocation = this.personDebug.getUniformLocation("u_view");
    gl.uniformMatrix4fv(viewMatrixLocation, false, view);

    const projectionMatrixLocation = this.personDebug.getUniformLocation(
      "u_proj"
    );
    gl.uniformMatrix4fv(projectionMatrixLocation, false, proj);

    gl.uniform1ui(
      this.personDebug.getUniformLocation("u_renderIds"),
      renderIds ? 1 : 0
    );
    gl.uniform1i(
      this.personDebug.getUniformLocation("u_selectedId"),
      this.selectedId
    );

    gl.uniform2f(
      this.personDebug.getUniformLocation("u_sizeMap"),
      this.width,
      this.height
    );
    gl.uniform2f(
      this.personDebug.getUniformLocation("u_scale"),
      this.width / this.pixelsX,
      this.height / this.pixelsY
    );
    gl.uniform1f(
      this.personDebug.getUniformLocation("u_cubeSize"),
      AppSettings.personSize
    );

    const heightLocation = this.personDebug.getUniformLocation("u_height");
    gl.uniform1f(heightLocation, height);

    const colorLocation = this.personDebug.getUniformLocation("u_color");
    gl.uniform4f(colorLocation, 1.0, 1.0, 1.0, 1.0);

    gl.bindVertexArray(this.cubeVAO);
    gl.drawElementsInstanced(
      gl.TRIANGLES,
      36,
      gl.UNSIGNED_SHORT,
      0,
      buffers.count
    );
    gl.bindVertexArray(null);

    gl.bindBufferBase(gl.SHADER_STORAGE_BUFFER, 0, null);
    gl.bindBufferBase(gl.SHADER_STORAGE_BUFFER, 1, null);

    this.personDebug.unuse();
  }
}

const CUBEDATA = new Float32Array([
  // Front face
  -1.0,
  -1.0,
  1.0,
  1.0,
  -1.0,
  1.0,
  1.0,
  1.0,
  1.0,
  -1.0,
  1.0,
  1.0,

  // Back face
  -1.0,
  -1.0,
  -1.0,
  -1.0,
  1.0,
  -1.0,
  1.0,
  1.0,
  -1.0,
  1.0,
  -1.0,
  -1.0,

  // Top face
  -1.0,
  1.0,
  -1.0,
  -1.0,
  1.0,
  1.0,
  1.0,
  1.0,
  1.0,
  1.0,
  1.0,
  -1.0,

  // Bottom face
  -1.0,
  -1.0,
  -1.0,
  1.0,
  -1.0,
  -1.0,
  1.0,
  -1.0,
  1.0,
  -1.0,
  -1.0,
  1.0,

  // Right face
  1.0,
  -1.0,
  -1.0,
  1.0,
  1.0,
  -1.0,
  1.0,
  1.0,
  1.0,
  1.0,
  -1.0,
  1.0,

  // Left face
  -1.0,
  -1.0,
  -1.0,
  -1.0,
  -1.0,
  1.0,
  -1.0,
  1.0,
  1.0,
  -1.0,
  1.0,
  -1.0
]);

const CUBEINDICES = new Int16Array([
  0,
  1,
  2,
  0,
  2,
  3, // front
  4,
  5,
  6,
  4,
  6,
  7, // back
  8,
  9,
  10,
  8,
  10,
  11, // top
  12,
  13,
  14,
  12,
  14,
  15, // bottom
  16,
  17,
  18,
  16,
  18,
  19, // right
  20,
  21,
  22,
  20,
  22,
  23 // left
]);
