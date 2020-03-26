import {GLSLSources} from '../GLSLSources';

export const ConnectionsRenderShader = new GLSLSources(
    'ConnectionsRenderShader',
    require('./glsl/connections.vert'),
    require('./glsl/connections.frag')
);
