import {GLSLSources} from '../GLSLSources';

export const NodeRenderShader = new GLSLSources(
    'NodeRenderShader',
    require('./glsl/node.vert'),
    require('./glsl/node.frag')
);
