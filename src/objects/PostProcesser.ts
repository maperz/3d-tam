import { gl, canvas } from "../engine/Context";
import { Shader } from "../engine/Shader";
import { createShaderFromSources } from "../engine/utils/Utils";
import { PostProcessingShader } from "../shaders/heightmap/PostProcessing";

export class PostProcesser {
  private shader: Shader;
  private vertexBuffer: WebGLBuffer;

  init() {
    this.shader = createShaderFromSources(PostProcessingShader);
  }

  private createTexture() {
    let texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

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

    return texture;
  }

  private createFramebuffer() {
    let buffer = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, buffer);
    let texture = gl.createTexture();
    gl.framebufferTexture2D(
      gl.FRAMEBUFFER,
      gl.COLOR_ATTACHMENT0,
      gl.TEXTURE_2D,
      texture,
      0
    );

    return {
      texture: texture,
      buffer: buffer,
    };
  }

  drawLines(colorTexture: WebGLTexture, heightTexture: WebGLTexture) {
    this.shader.use();
    if (this.vertexBuffer == null) {
      var vertexData = [
        1.0,
        1.0,
        -1.0,
        1.0,
        -1.0,
        -1.0,
        -1.0,
        -1.0,
        1.0,
        -1.0,
        1.0,
        1.0,
      ];
      this.vertexBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
      gl.bufferData(
        gl.ARRAY_BUFFER,
        new Float32Array(vertexData),
        gl.STATIC_DRAW
      );
    }

    gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

    gl.drawArrays(gl.TRIANGLES, 0, 6);

    // Cleanup:
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
  }
}
