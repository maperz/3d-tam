import {GLSLSources} from '../GLSLSources';

export const BoundaryRenderShader = new GLSLSources(
    'BoundaryRenderShader',
    require('./glsl/boundary_render.vert'),
    require('./glsl/boundary_render.frag')
);
