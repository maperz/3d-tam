import {GLSLSources} from '../GLSLSources';

export const AttractionForceCompute = new GLSLSources(
    'AttractionForceCompute',
    null,
    null,
    require('./glsl/attraction_force.glsl')
);
