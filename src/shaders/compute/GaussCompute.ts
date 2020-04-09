import {GLSLSources} from '../GLSLSources';

export const GaussCompute = new GLSLSources(
    'GaussCompute',
    null,
    null,
    require('./glsl/gauss.glsl')
);
