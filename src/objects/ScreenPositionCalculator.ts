import { gl, canvas } from "../engine/Context";
import { Shader } from "../engine/Shader";
import { createShaderFromSources } from "../engine/utils/Utils";
import { ScreenPositionCompute } from "../shaders/compute/ScreenPositionCompute";
import { DataBuffers } from "./DataBuffers";
import { mat4, vec2 } from "gl-matrix";

export class ScreenPositionCalculator {
  private shader: Shader;
  private data: Float32Array;

  init(buffer: DataBuffers) {
    this.shader = createShaderFromSources(ScreenPositionCompute);
    this.data = new Float32Array(buffer.count * 2);
  }

  calculate(buffer: DataBuffers, mvp: mat4, scaling: mat4) {
    this.shader.use();

    gl.bindBufferBase(gl.SHADER_STORAGE_BUFFER, 0, buffer.position3dBuffer);
    gl.bindBufferBase(gl.SHADER_STORAGE_BUFFER, 1, buffer.screenPositionBuffer);

    const modelMatrixLocation = this.shader.getUniformLocation("u_mvp");
    gl.uniformMatrix4fv(modelMatrixLocation, false, mvp);

    gl.uniformMatrix4fv(
      this.shader.getUniformLocation("u_scaling"),
      false,
      scaling
    );

    gl.uniform1i(this.shader.getUniformLocation("u_count"), buffer.count);
    gl.uniform2f(
      this.shader.getUniformLocation("u_screenSize"),
      canvas.width,
      canvas.height
    );

    gl.dispatchCompute(Math.ceil(buffer.count / 16), 1, 1);

    this.shader.unuse();

    gl.bindBuffer(gl.SHADER_STORAGE_BUFFER, buffer.screenPositionBuffer);
    gl.getBufferSubData(gl.SHADER_STORAGE_BUFFER, 0, this.data);
    gl.bindBuffer(gl.SHADER_STORAGE_BUFFER, null);
  }

  getData() {
    return this.data;
  }
}
