import {Shader} from '../Shader';

export function createShaderFromIDs(vertexShaderId: string, fragmentShaderId: string): Shader {

    const vertexScript = document.getElementById(vertexShaderId) as HTMLScriptElement;
    const vertexSource = vertexScript.text;

    const fragmentScript = document.getElementById(fragmentShaderId) as HTMLScriptElement;
    const fragmentSource = fragmentScript.text;

    const program = new Shader();
    program.create(vertexSource, fragmentSource);

    return program;
}
