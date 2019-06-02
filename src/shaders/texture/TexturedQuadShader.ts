import {GLSLSources} from '../GLSLSources';

export const TexturedQuadShader = new GLSLSources(
    'TexturedQuadShader',
    require('./glsl/texturedquad.vert'),
    require('./glsl/texturedquad.frag')
);
