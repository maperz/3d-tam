import {GLSLSources} from '../GLSLSources';

export const DilationShader = new GLSLSources(
    'DilationShader',
    require('./glsl/dilation/dilation.vert'),
    require('./glsl/dilation/dilation.frag')
);
