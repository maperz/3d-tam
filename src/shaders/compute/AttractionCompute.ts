import {GLSLSources} from '../GLSLSources';

export const AttractionCompute = new GLSLSources(
    'AttractionCompute',
    null,
    null,
    require('./glsl/attraction.glsl')
);
