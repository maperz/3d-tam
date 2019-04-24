import {GLSLSources} from './GLSLSources';

export const BasicShader = new GLSLSources(
    'Basic',
    require('./glsl/basic.vert'),
    require('./glsl/basic.frag')
);
