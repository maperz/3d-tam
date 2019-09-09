import {GLSLSources} from '../GLSLSources';

export const RepulsionCompute = new GLSLSources(
    'RepulsionCompute',
    null,
    null,
    require('./glsl/bruteforce_repulsion.glsl')
);
