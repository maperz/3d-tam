import {GLSLSources} from '../GLSLSources';

export const ConnectionHeadShader = new GLSLSources(
    'ConnectionBillboardShader',
    require('./glsl/connection_head.vert'),
    require('./glsl/connection_head.frag')
);
