import {GLSLSources} from '../GLSLSources';

export const FDGDebugShader = new GLSLSources(
    'FDGDebugShader',
    require('./glsl/fdgdebug.vert'),
    require('./glsl/fdgdebug.frag')
);
