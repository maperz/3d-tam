import {GLSLSources} from '../GLSLSources';

export const BoundaryCompute = new GLSLSources(
    'BoundaryCompute',
    null,
    null,
    require('./glsl/boundary_reduction.glsl')
);
