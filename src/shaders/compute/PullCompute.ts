import {GLSLSources} from '../GLSLSources';

export const PullCompute = new GLSLSources(
    'PullCompute',
    null,
    null,
    require('./glsl/pull.glsl')
);
