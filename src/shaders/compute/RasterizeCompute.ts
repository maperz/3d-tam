import {GLSLSources} from '../GLSLSources';

export const RasterizeCompute = new GLSLSources(
    'RasterizeCompute',
    null,
    null,
    require('./glsl/rasterize.glsl')
);
