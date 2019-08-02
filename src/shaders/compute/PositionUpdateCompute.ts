import {GLSLSources} from '../GLSLSources';

export const PositionUpdateCompute = new GLSLSources(
    'PositionUpdateCompute',
    null,
    null,
    require('./glsl/positionupdate.glsl')
);
