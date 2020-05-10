import {GLSLSources} from '../GLSLSources';

export const ApplyForcesCompute = new GLSLSources(
    'ApplyForcesCompute',
    null,
    null,
    require('./glsl/apply_forces.glsl')
);
