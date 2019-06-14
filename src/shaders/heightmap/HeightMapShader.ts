import {GLSLSources} from '../GLSLSources';

export const HeightMapShader = new GLSLSources(
    'HeightMapShader',
    require('./glsl/heightmap.vert'),
    require('./glsl/heightmap.frag')
);
