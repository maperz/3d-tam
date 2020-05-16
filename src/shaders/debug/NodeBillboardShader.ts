import {GLSLSources} from '../GLSLSources';

export const NodeBillboardShader = new GLSLSources(
    'NodeBillboardShader',
    require('./glsl/node_billboard.vert'),
    require('./glsl/node_billboard.frag')
);
