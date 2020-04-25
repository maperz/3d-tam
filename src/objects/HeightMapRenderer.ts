import { mat4 } from "gl-matrix";
import { AppSettings } from "../application/AppSettings";
import { gl } from "../engine/Context";
import { TPAssert } from "../engine/error/TPException";
import { Shader } from "../engine/Shader";
import { createShaderFromSources } from "../engine/utils/Utils";
import { HeightMapShader } from "../shaders/heightmap/HeightMapShader";
import { NormalsCalculator } from "./NormalsCalculator";
import { PixelGrid } from "./PixelGrid";
import { PostProcesser } from "./PostProcesser";

class ChunkDrawInfo {
  constructor(public vao: WebGLVertexArrayObject, public elements: number) {}
}

export class HeightMapRenderer {
  private shader: Shader;

  private chunkInfos: ChunkDrawInfo[];
  private pixelsX: number;
  private pixelsY: number;
  private normalsCalculator: NormalsCalculator;

  private colorRampTexture: WebGLTexture;

  private useLightsLoc: WebGLUniformLocation;
  private colorRampLoc: WebGLUniformLocation;
  private invertColorRampLoc: WebGLUniformLocation;
  private numSegmentsLoc: WebGLUniformLocation;
  private showSegmentLinesLoc: WebGLUniformLocation;
  private smoothRampLoc: WebGLUniformLocation;

  private postProcessor: PostProcesser;

  init(
    width: number,
    height: number,
    tilesX: number,
    tilesY: number,
    pixelsX: number,
    pixelsY: number
  ) {
    this.pixelsX = pixelsX;
    this.pixelsY = pixelsY;

    this.shader = createShaderFromSources(HeightMapShader);

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

    this.setColorRamp(`images/${AppSettings.colorRamp}`);
    this.colorRampLoc = this.shader.getUniformLocation("u_colorRamp");
    this.useLightsLoc = this.shader.getUniformLocation("u_useLights");
    this.invertColorRampLoc = this.shader.getUniformLocation(
      "u_invertColorRamp"
    );
    this.numSegmentsLoc = this.shader.getUniformLocation("u_numSegments");
    this.showSegmentLinesLoc = this.shader.getUniformLocation(
      "u_showSegmentLines"
    );
    this.smoothRampLoc = this.shader.getUniformLocation("u_useSmoothRamp");

    this.postProcessor = new PostProcesser();
    this.postProcessor.init();
    //this.createHeightFrameBuffer();
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

  draw(
    heightMapTexture: WebGLTexture,
    height: number,
    mvp: mat4,
    useLights: boolean = false,
    wireframe: boolean = false
  ) {

    TPAssert(
      this.shader != null,
      "Shader == null! Forgot to init HeightMapRenderer?"
    );

    if (heightMapTexture) {
      this.normalsCalculator.calculateNormals(heightMapTexture, height);
      this.drawMap(heightMapTexture, height, mvp, useLights, wireframe, false);

      //this.postProcessor.startHeightRendering();
      //this.drawMap(buffer, heightMapTexture, height, model, view, proj, useLights, wireframe, true);
      //this.postProcessor.startColorRendering();
      //this.drawMap(buffer, heightMapTexture, height, model, view, proj, useLights, wireframe, false);
      //this.postProcessor.doPostProcess();
    }
  }

  private drawMap(
    heightMapTexture: WebGLTexture,
    height: number,
    mvp: mat4,
    useLights: boolean,
    wireframe: boolean,
    drawHeight: boolean
  ) {
    this.shader.use();

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.colorRampTexture);
    gl.uniform1i(this.colorRampLoc, 0);
    gl.uniform1i(this.invertColorRampLoc, AppSettings.invertColorRamp ? 1 : 0);
    gl.uniform1i(this.smoothRampLoc, AppSettings.smoothRamp ? 1 : 0);
    gl.uniform1i(
      this.showSegmentLinesLoc,
      AppSettings.showSegmentLines ? 1 : 0
    );

    gl.uniform1i(this.numSegmentsLoc, AppSettings.numSegments);

    gl.uniform1i(this.useLightsLoc, useLights ? 1 : 0);

    gl.uniform1i(
      this.shader.getUniformLocation("u_renderHeightValues"),
      drawHeight ? 1 : 0
    );

    const modelMatrixLocation = this.shader.getUniformLocation("u_mvp");
    gl.uniformMatrix4fv(modelMatrixLocation, false, mvp);

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
}