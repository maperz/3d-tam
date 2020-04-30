import {GLSLSources} from '../GLSLSources';

export const FamilyForceCompute = new GLSLSources(
    'FamilyForceCompute',
    null,
    null,
    require('./glsl/family_force.glsl')
);
