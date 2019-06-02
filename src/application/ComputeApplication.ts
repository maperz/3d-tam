import {GUI} from 'dat.gui';
import {mat4} from 'gl-matrix';
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
import {DilationCompute} from '../shaders/compute/DilationCompute';

export class ComputeApplication extends ComputeGLApplication {

    onStart(): void {
        let dilationShader = createShaderFromSources(DilationCompute);
    }

    onUpdate(deltaTime: number): void {
        console.log("Test");


    }
}
