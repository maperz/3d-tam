import {GLSLSources} from '../GLSLSources';

export const PushCompute = new GLSLSources(
    'PushCompute',
    null,
    null,
    require('./glsl/push.glsl')
);
