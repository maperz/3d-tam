import {GLSLSources} from './GLSLSources';

export const PushShader = new GLSLSources(
    'PushShader',
    require('./glsl/pushpull/push.vert'),
    require('./glsl/pushpull/push.frag')
);
