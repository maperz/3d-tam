import {GLSLSources} from '../GLSLSources';

export const ClearCompute = new GLSLSources(
    'ClearCompute',
    null,
    null,
    require('./glsl/clear.glsl')
);
