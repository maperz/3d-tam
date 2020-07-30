import {GLSLSources} from '../GLSLSources';

export const RasterizeBufferCompute = new GLSLSources(
    'RasterizeBufferCompute',
    null,
    null,
    require('./glsl/rasterize_buffer.glsl')
);
