import { DataBuffers } from "./DataBuffers";
import { mat4, vec3 } from "gl-matrix";
import { gl, canvas } from "../engine/Context";
import { AppSettings } from "../application/AppSettings";
import { ScreenPositionCalculator } from "./ScreenPositionCalculator";
import { Shader } from "../engine/Shader";
import { TPAssert } from "../engine/error/TPException";
import { createShaderFromSources } from "../engine/utils/Utils";
import { ConnectionsRenderShader } from "../shaders/debug/ConnectionsRenderShader";
import { NodeRenderShader } from "../shaders/debug/NodeRenderShader";
import { BoundaryRenderShader } from "../shaders/debug/BoundaryRenderShader";
import { NodeBillboardShader } from "../shaders/debug/NodeBillboardShader";
import { ConnectionHeadShader } from "../shaders/debug/ConnectionHeadShader";

export class GraphRenderer {
  private nodeShader: Shader;
  private connectionShader: Shader;
  private boundaryShader: Shader;
  private nodeBillboardShader: Shader;
  private connectionHeadShader: Shader;

  private cubeVAO: WebGLVertexArrayObject;
  private billboardVAO: WebGLVertexArrayObject;
  private boundaryVAO: WebGLVertexArrayObject;

  private selectedId = -1;
  private screenPositionCalculator: ScreenPositionCalculator;
  private nodeFramebuffer: WebGLFramebuffer;

  private circleTexture: WebGLTexture;
  private headTexture: WebGLTexture;

  init() {
    this.nodeShader = createShaderFromSources(NodeRenderShader);
    this.connectionShader = createShaderFromSources(ConnectionsRenderShader);
    this.boundaryShader = createShaderFromSources(BoundaryRenderShader);
    this.nodeBillboardShader = createShaderFromSources(NodeBillboardShader);
    this.connectionHeadShader = createShaderFromSources(ConnectionHeadShader);

    this.circleTexture = loadTexture(gl, "textures/circle.png");
    this.headTexture = loadTexture(gl, "textures/circle_filled.png");

    this.createInstanceInfo();
    this.nodeFramebuffer = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.nodeFramebuffer);

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

    TPAssert(
      gl.checkFramebufferStatus(gl.FRAMEBUFFER) == gl.FRAMEBUFFER_COMPLETE,
      "Framebuffer incomplete!"
    );

    gl.bindTexture(gl.TEXTURE_2D, null);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  }

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

    this.billboardVAO = gl.createVertexArray();
    gl.bindVertexArray(this.billboardVAO);

    const billboardVertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, billboardVertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, SQUAREDATA, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    gl.bindVertexArray(null);

    this.boundaryVAO = gl.createVertexArray();
    gl.bindVertexArray(this.boundaryVAO);

    const boundaryVertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, boundaryVertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, CUBE_LINES, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);
    gl.bindVertexArray(null);
  }

  draw(
    buffer: DataBuffers,
    mvp: mat4,
    view: mat4,
    proj: mat4,
    model: mat4,
    scaling: mat4
  ) {
    TPAssert(
      this.nodeShader != null,
      "NodeShader == null! Forgot to init GraphRenderer?"
    );

    if (this.screenPositionCalculator == null && AppSettings.showNames) {
      this.screenPositionCalculator = new ScreenPositionCalculator();
      this.screenPositionCalculator.init(buffer);
    }
    const oldClearColor = gl.getParameter(gl.COLOR_CLEAR_VALUE);

    if (!AppSettings.enableGraphDepthTest) {
      gl.disable(gl.DEPTH_TEST);
    }

    if (AppSettings.showNames) {
      this.screenPositionCalculator.calculate(buffer, mvp, scaling);
    }

    if (AppSettings.renderGraph && AppSettings.connectionSize > 0) {
      this.drawConnections(buffer, mvp, scaling);
    }

    if (AppSettings.renderGraph && AppSettings.personSize > 0) {
      gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, this.nodeFramebuffer);
      gl.clearColor(0.0, 0.0, 0.0, 0.0);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      this.drawNodes(buffer, mvp, scaling, true);
      gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, null);
      if (!AppSettings.showNames) {
        this.drawNodeBillboards(buffer, mvp, proj, view, model, scaling);
        //this.drawNodes(buffer, mvp, scaling, false);
      }
    }

    if (AppSettings.renderGraph && AppSettings.connectionSize > 0) {
      this.drawConnectionHeads(buffer, mvp, proj, view, model, scaling);
    }

    gl.enable(gl.DEPTH_TEST);
    gl.clearColor(
      oldClearColor[0],
      oldClearColor[1],
      oldClearColor[2],
      oldClearColor[3]
    );
  }

  private drawNodes(
    buffers: DataBuffers,
    mvp: mat4,
    scaling: mat4,
    renderIds: boolean = false
  ) {
    if (renderIds) {
      gl.disable(gl.BLEND);
    }

    this.nodeShader.use();

    gl.bindBufferBase(gl.SHADER_STORAGE_BUFFER, 0, buffers.position3dBuffer);

    const modelMatrixLocation = this.nodeShader.getUniformLocation("u_mvp");
    gl.uniformMatrix4fv(modelMatrixLocation, false, mvp);

    gl.uniformMatrix4fv(
      this.nodeShader.getUniformLocation("u_scaling"),
      false,
      scaling
    );

    gl.uniform1ui(
      this.nodeShader.getUniformLocation("u_renderIds"),
      renderIds ? 1 : 0
    );
    gl.uniform1i(
      this.nodeShader.getUniformLocation("u_selectedId"),
      this.selectedId
    );

    gl.uniform1f(
      this.nodeShader.getUniformLocation("u_cubeSize"),
      AppSettings.personSize
    );

    const colorLocation = this.nodeShader.getUniformLocation("u_color");
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

    this.nodeShader.unuse();
  }

  private drawConnections(buffers: DataBuffers, mvp: mat4, scaling: mat4) {
    this.connectionShader.use();

    var vertexArrayA = gl.createVertexArray();
    gl.bindVertexArray(vertexArrayA);

    gl.bindBufferBase(gl.SHADER_STORAGE_BUFFER, 0, buffers.position3dBuffer);
    gl.bindBufferBase(gl.SHADER_STORAGE_BUFFER, 1, buffers.edgeInfoBuffer);

    gl.uniformMatrix4fv(
      this.connectionShader.getUniformLocation("u_mvp"),
      false,
      mvp
    );

    gl.uniform1i(
      this.connectionShader.getUniformLocation("u_selectedId"),
      this.selectedId
    );

    gl.uniformMatrix4fv(
      this.connectionShader.getUniformLocation("u_scaling"),
      false,
      scaling
    );

    gl.uniform1f(
      this.connectionShader.getUniformLocation("u_personSize"),
      AppSettings.personSize
    );

    gl.lineWidth(AppSettings.connectionSize);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.edgeIndexBuffer);
    gl.drawArraysInstanced(gl.LINES, 0, 2, buffers.edgeIndiciesCount / 2);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);

    gl.lineWidth(1);

    gl.bindBufferBase(gl.SHADER_STORAGE_BUFFER, 0, null);
    gl.bindBufferBase(gl.SHADER_STORAGE_BUFFER, 1, null);

    this.connectionShader.unuse();
  }

  private drawNodeBillboards(
    buffers: DataBuffers,
    mvp: mat4,
    proj: mat4,
    view: mat4,
    model: mat4,
    scaling: mat4
  ) {
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    this.nodeBillboardShader.use();

    gl.bindBufferBase(gl.SHADER_STORAGE_BUFFER, 0, buffers.position3dBuffer);

    gl.uniformMatrix4fv(
      this.nodeBillboardShader.getUniformLocation("u_mvp"),
      false,
      mvp
    );

    gl.uniformMatrix4fv(
      this.nodeBillboardShader.getUniformLocation("u_view"),
      false,
      view
    );
    gl.uniformMatrix4fv(
      this.nodeBillboardShader.getUniformLocation("u_proj"),
      false,
      proj
    );
    gl.uniformMatrix4fv(
      this.nodeBillboardShader.getUniformLocation("u_model"),
      false,
      model
    );

    gl.uniformMatrix4fv(
      this.nodeBillboardShader.getUniformLocation("u_scaling"),
      false,
      scaling
    );

    // TODO:
    gl.uniform1ui(
      this.nodeBillboardShader.getUniformLocation("u_renderIds"),
      false ? 1 : 0
    );
    gl.uniform1i(
      this.nodeBillboardShader.getUniformLocation("u_selectedId"),
      this.selectedId
    );

    gl.uniform1f(
      this.nodeBillboardShader.getUniformLocation("u_cubeSize"),
      AppSettings.personSize
    );

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.circleTexture);
    gl.uniform1i(this.nodeBillboardShader.getUniformLocation("u_circleTex"), 0);

    const colorLocation = this.nodeBillboardShader.getUniformLocation(
      "u_color"
    );
    gl.uniform4f(colorLocation, 1.0, 1.0, 1.0, 1.0);

    gl.bindVertexArray(this.billboardVAO);
    gl.drawArraysInstanced(
      gl.TRIANGLES,
      0,
      SQUAREDATA.length / 2,
      buffers.count
    );
    gl.bindVertexArray(null);

    gl.bindBufferBase(gl.SHADER_STORAGE_BUFFER, 0, null);

    this.nodeBillboardShader.unuse();
    gl.disable(gl.BLEND);
  }

  private drawConnectionHeads(
    buffers: DataBuffers,
    mvp: mat4,
    proj: mat4,
    view: mat4,
    model: mat4,
    scaling: mat4
  ) {
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    this.connectionHeadShader.use();

    gl.bindBufferBase(gl.SHADER_STORAGE_BUFFER, 0, buffers.position3dBuffer);
    gl.bindBufferBase(gl.SHADER_STORAGE_BUFFER, 1, buffers.edgeInfoBuffer);

    gl.uniformMatrix4fv(
      this.connectionHeadShader.getUniformLocation("u_mvp"),
      false,
      mvp
    );
    gl.uniformMatrix4fv(
      this.connectionHeadShader.getUniformLocation("u_view"),
      false,
      view
    );
    gl.uniformMatrix4fv(
      this.connectionHeadShader.getUniformLocation("u_proj"),
      false,
      proj
    );
    gl.uniformMatrix4fv(
      this.connectionHeadShader.getUniformLocation("u_model"),
      false,
      model
    );

    gl.uniform1f(
      this.connectionHeadShader.getUniformLocation("u_personSize"),
      AppSettings.personSize
    );

    gl.uniform1i(
      this.connectionHeadShader.getUniformLocation("u_selectedId"),
      this.selectedId
    );

    gl.uniformMatrix4fv(
      this.connectionHeadShader.getUniformLocation("u_scaling"),
      false,
      scaling
    );

    gl.uniform4f(
      this.connectionHeadShader.getUniformLocation("u_color"),
      1.0,
      1.0,
      1.0,
      1.0
    );

    gl.bindVertexArray(this.billboardVAO);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.headTexture);
    gl.uniform1i(this.nodeBillboardShader.getUniformLocation("u_texture"), 0);

    gl.drawArraysInstanced(
      gl.TRIANGLES,
      0,
      SQUAREDATA.length / 2,
      buffers.edgeIndiciesCount / 2
    );
    gl.bindVertexArray(null);

    gl.bindBufferBase(gl.SHADER_STORAGE_BUFFER, 0, null);
    gl.bindBufferBase(gl.SHADER_STORAGE_BUFFER, 1, null);

    this.connectionHeadShader.unuse();
    gl.disable(gl.BLEND);
  }

  drawDebugBoundarys(boundarys: Float32Array, mvp: mat4, scaling: mat4) {
    this.boundaryShader.use();

    const width = boundarys[2] - boundarys[0];
    const height = boundarys[3] - boundarys[1];

    const centerX = boundarys[0] + width / 2;
    const centerY = boundarys[1] + height / 2;

    const boundarySize = vec3.fromValues(width, 1, height);
    const boundaryCenter = vec3.fromValues(centerX, 0.5, centerY);

    gl.uniform3fv(
      this.boundaryShader.getUniformLocation("u_boundarySize"),
      boundarySize
    );

    gl.uniform3fv(
      this.boundaryShader.getUniformLocation("u_boundaryCenter"),
      boundaryCenter
    );

    gl.uniformMatrix4fv(
      this.boundaryShader.getUniformLocation("u_mvp"),
      false,
      mvp
    );

    gl.uniformMatrix4fv(
      this.boundaryShader.getUniformLocation("u_scaling"),
      false,
      scaling
    );

    gl.bindVertexArray(this.boundaryVAO);
    gl.drawArrays(gl.LINES, 0, CUBE_LINES.length);
    gl.bindVertexArray(null);

    this.boundaryShader.unuse();
  }
  setSelectedPerson(id: number) {
    this.selectedId = id != null ? id : -1;
  }

  getSelectedNode() {
    return this.selectedId;
  }

  getPersonAt(x: number, y: number): number {
    if (AppSettings.renderGraph && AppSettings.personSize > 0) {
      const rgba = new Uint8Array(4);
      gl.bindFramebuffer(gl.READ_FRAMEBUFFER, this.nodeFramebuffer);
      gl.readPixels(x, y, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, rgba);
      gl.bindFramebuffer(gl.READ_FRAMEBUFFER, null);
      if (!rgba.every((v) => v === 0)) {
        const id =
          rgba[0] + (rgba[1] << 8) + (rgba[2] << 16) + (rgba[3] << 24) - 1;
        return id;
      }
    }
    return null;
  }

  getNodeScreenPositions() {
    if (this.screenPositionCalculator && AppSettings.showNames) {
      return this.screenPositionCalculator.getData();
    }
    return null;
  }
}

const SQUAREDATA = new Float32Array([
  -1.0,
  -1.0,
  -1.0,
  1.0,
  1.0,
  -1.0,

  -1.0,
  1.0,
  1.0,
  1.0,
  1.0,
  -1.0,
]);

const CUBE_LINES = new Float32Array([
  -1,
  -1,
  -1,
  -1,
  1,
  -1,
  -1,
  1,
  -1,
  1,
  1,
  -1,
  1,
  1,
  -1,
  1,
  -1,
  -1,
  1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  1,
  -1,
  1,
  1,
  -1,
  1,
  1,
  1,
  1,
  1,
  1,
  1,
  1,
  1,
  -1,
  1,
  1,
  -1,
  1,
  -1,
  -1,
  1,
  -1,
  -1,
  -1,
  -1,
  -1,
  1,
  -1,
  1,
  -1,
  -1,
  1,
  1,
  1,
  1,
  -1,
  1,
  1,
  1,
  1,
  -1,
  -1,
  1,
  -1,
  1,
]);

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
  -1.0,
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
  23, // left
]);

function loadTexture(gl, url) {
  const texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);

  const level = 0;
  const internalFormat = gl.RGBA;
  const width = 1;
  const height = 1;
  const border = 0;
  const srcFormat = gl.RGBA;
  const srcType = gl.UNSIGNED_BYTE;
  const pixel = new Uint8Array([0, 0, 255, 255]); // opaque blue
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

    if (isPowerOf2(image.width) && isPowerOf2(image.height)) {
      gl.generateMipmap(gl.TEXTURE_2D);
    } else {
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    }
  };
  image.src = url;

  return texture;
}

function isPowerOf2(value) {
  return (value & (value - 1)) == 0;
}
