import {GUI} from 'dat.gui';
import {ComputeGLApplication} from '../engine/application/ComputeGLApplication';
import {WebGLApplication} from '../engine/application/WebGLApplication';
import {canvas, gl} from '../engine/Context';
import {Mat4} from '../engine/math/mat4';
import {inRadians} from '../engine/math/Utils';
import {Shader} from '../engine/Shader';
import {createShaderFromSources} from '../engine/utils/Utils';
import {Cube} from '../objects/Cube';
import {Plane} from '../objects/Plane';
import {BasicShader} from '../shaders/Basic';
import {BasicCube} from '../shaders/BasicCube';
import {BasicShaderSingleColor} from '../shaders/BasicSingleColor';

export class ComputeApplication extends ComputeGLApplication {

    onStart(): void {
        let test = gl.createShader(gl.COMPUTE_SHADER)
    }

    onUpdate(deltaTime: number): void {
        console.log("Test");
    }
}
