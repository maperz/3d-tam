import {GLSLSources} from '../GLSLSources';

export const FDGDebugLineShader = new GLSLSources(
    'FDGDebugLineShader',
    require('./glsl/fdgdebug_lines.vert'),
    require('./glsl/fdgdebug.frag')
);
