import {GLSLSources} from '../GLSLSources';

export const FlattenerCompute = new GLSLSources(
    'FlattenerCompute',
    null,
    null,
    require('./glsl/flattener.glsl')
);
