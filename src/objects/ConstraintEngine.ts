import {gl} from '../engine/Context';
import {TPAssert} from '../engine/error/TPException';
import {Shader} from '../engine/Shader';
import {createShaderFromSources} from '../engine/utils/Utils';
import { ConstraintShader } from '../shaders/constraint/ConstraintShader';
import { mat4 } from 'gl-matrix';

export class ConstraintEngine {

    private width: number;
    private height: number;
    private output: WebGLTexture;
    private shader: Shader;

    private initialized = false;

    private frameBuffer: WebGLFramebuffer;

    private radiusLocation : WebGLUniformLocation;
    private projMatrixLocation: WebGLUniformLocation;

    private projMatrix: mat4;

    init(width: number, height: number) {
        this.width = width;
        this.height = height;

        this.output = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, this.output);
        gl.texStorage2D(gl.TEXTURE_2D, 1, gl.R32F, this.width, this.height);
        gl.bindTexture(gl.TEXTURE_2D, null);

        this.shader = createShaderFromSources(ConstraintShader);

        // Create and bind the framebuffer
        this.frameBuffer = gl.createFramebuffer();
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.frameBuffer);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.output, 0);
        TPAssert(gl.checkFramebufferStatus(gl.FRAMEBUFFER) == gl.FRAMEBUFFER_COMPLETE, "Framebuffer incomplete!");
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);

        this.radiusLocation = this.shader.getUniformLocation("u_radius");
        this.projMatrixLocation = this.shader.getUniformLocation('u_proj');
        this.projMatrix = mat4.ortho(mat4.create(), 0, this.width, 0, this.height, -1, 1);

        this.initialized = true;
    }


    renderConstraints(radius: number, samples: number, position: WebGLBuffer, values: WebGLBuffer, indexBuffer: WebGLBuffer, indiciesCount: number): WebGLTexture {
      
        TPAssert(this.initialized, 'ConstraintEngine needs to be initialized before usage.');
        const oldClearColor = gl.getParameter(gl.COLOR_CLEAR_VALUE);
        gl.clearColor(0.0, 0.0, 0.0, 1.0);
  
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.frameBuffer);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        gl.viewport(0, 0, this.width, this.height);

        this.shader.use();

        let positionLoc = this.shader.getAttribLocation('a_position');
        gl.enableVertexAttribArray(positionLoc);

        gl.bindBuffer(gl.ARRAY_BUFFER, position);

        gl.vertexAttribPointer(positionLoc, 2, gl.FLOAT, false, 0,0) ;

        let valuesLoc = this.shader.getAttribLocation('a_value');
        gl.enableVertexAttribArray(valuesLoc);
        gl.bindBuffer(gl.ARRAY_BUFFER, values);
        gl.vertexAttribPointer(valuesLoc, 1, gl.FLOAT, false, 0,0) ;

        gl.uniformMatrix4fv(this.projMatrixLocation, false, this.projMatrix);

        gl.uniform1f(this.radiusLocation, radius);

        gl.bindBuffer(gl.ARRAY_BUFFER, null);

        gl.drawArrays(gl.POINTS, 0, samples);

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
        gl.drawElements(gl.LINES, indiciesCount, gl.UNSIGNED_SHORT, 0);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
        gl.disableVertexAttribArray(positionLoc);
        gl.disableVertexAttribArray(valuesLoc);

        gl.bindFramebuffer(gl.FRAMEBUFFER, null);

        this.shader.unuse();
        gl.memoryBarrier(gl.FRAMEBUFFER_BARRIER_BIT | gl.TEXTURE_UPDATE_BARRIER_BIT);
        gl.clearColor(oldClearColor[0], oldClearColor[1], oldClearColor[2], oldClearColor[3]);
        
        return this.output;
    }
}
