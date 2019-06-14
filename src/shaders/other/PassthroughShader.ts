import {GLSLSources} from '../GLSLSources';

export const PassthroughShader = new GLSLSources(
    'PassthroughShader',
    require('./glsl/passthrough/passthrough.vert'),
    require('./glsl/passthrough/passthrough.frag')
);
