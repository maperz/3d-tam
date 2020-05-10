import {GLSLSources} from '../GLSLSources';

export const RepulsionForceCompute = new GLSLSources(
    'RepulsionForceCompute',
    null,
    null,
    require('./glsl/repulsion_force.glsl')
);
