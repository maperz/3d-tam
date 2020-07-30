import {GLSLSources} from '../GLSLSources';

export const DensityBufferCompute = new GLSLSources(
    'DensityBufferCompute',
    null,
    null,
    require('./glsl/density_buffer.glsl')
);
