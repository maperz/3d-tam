import {GLSLSources} from '../GLSLSources';

export const ConstraintShader = new GLSLSources(
    'ConstraintShader',
    require('./glsl/constraint.vert'),
    require('./glsl/constraint.frag')
);
