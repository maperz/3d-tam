import {GLSLSources} from '../../shaders/GLSLSources';
import {Shader} from '../Shader';

export function createShaderFromIDs(name: string, vertexShaderId: string, fragmentShaderId: string): Shader {

    const vertexScript = document.getElementById(vertexShaderId) as HTMLScriptElement;
    const vertexSource = vertexScript.text;

    const fragmentScript = document.getElementById(fragmentShaderId) as HTMLScriptElement;
    const fragmentSource = fragmentScript.text;

    const program = new Shader(name);
    program.create(vertexSource, fragmentSource);

    return program;
}

export const createShaderFromSources = (shaderProvider: GLSLSources): Shader => {

    const program = new Shader(shaderProvider.name);
    program.create(shaderProvider.vertexSource, shaderProvider.fragmentSource);

    return program;
};
