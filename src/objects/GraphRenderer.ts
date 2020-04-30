import { DataBuffers } from "./DataBuffers";
import { mat4, vec2, vec3 } from "gl-matrix";
import { gl, canvas } from "../engine/Context";
import { AppSettings } from "../application/AppSettings";
import { ScreenPositionCalculator } from "./ScreenPositionCalculator";
import { Shader } from "../engine/Shader";
import { TPAssert } from "../engine/error/TPException";
import { createShaderFromSources } from "../engine/utils/Utils";
import { ConnectionsRenderShader } from "../shaders/debug/ConnectionsRenderShader";
import { NodeRenderShader } from "../shaders/debug/NodeRenderShader";

export class GraphRenderer {
  private nodeShader: Shader;
  private connectionShader: Shader;
  private cubeVAO: WebGLVertexArrayObject;
  private selectedId = -1;
  private screenPositionCalculator: ScreenPositionCalculator;
  private nodeFramebuffer: WebGLFramebuffer;

  init() {
    this.nodeShader = createShaderFromSources(NodeRenderShader);
    this.connectionShader = createShaderFromSources(ConnectionsRenderShader);

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
  }

  draw(
    buffer: DataBuffers,
    mvp: mat4,
    scaling: mat4,
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

    gl.disable(gl.DEPTH_TEST);

    if (AppSettings.showNames) {
      this.screenPositionCalculator.calculate(
        buffer,
        mvp,
        scaling
      );
    }

    if (AppSettings.renderGraph && AppSettings.personSize > 0) {
      gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, this.nodeFramebuffer);
      gl.clearColor(0.0, 0.0, 0.0, 0.0);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      this.drawNodes(buffer, mvp, scaling, true);
      gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, null);
      if (!AppSettings.showNames) {
        this.drawNodes(buffer, mvp, scaling, false);
      }
    }

    if (AppSettings.renderGraph && AppSettings.connectionSize > 0) {
      this.drawConnections(buffer, mvp, scaling);
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

  private drawConnections(
    buffers: DataBuffers,
    mvp: mat4,
    scaling: mat4,
  ) {
    this.connectionShader.use();

    var vertexArrayA = gl.createVertexArray();
    gl.bindVertexArray(vertexArrayA);

    gl.bindBufferBase(gl.SHADER_STORAGE_BUFFER, 0, buffers.position3dBuffer);

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

    gl.lineWidth(AppSettings.connectionSize);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.edgeIndexBuffer);
    gl.drawElements(gl.LINES, buffers.edgeIndiciesCount, gl.UNSIGNED_SHORT, 0);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);

    gl.lineWidth(1);

    gl.bindBufferBase(gl.SHADER_STORAGE_BUFFER, 0, null);
    gl.bindBufferBase(gl.SHADER_STORAGE_BUFFER, 1, null);

    this.connectionShader.unuse();
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
