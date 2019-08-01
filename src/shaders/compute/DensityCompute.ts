import {GLSLSources} from '../GLSLSources';

export const DensityCompute = new GLSLSources(
    'DensityCompute',
    null,
    null,
    require('./glsl/density.glsl')
);
