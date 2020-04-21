import {GLSLSources} from '../GLSLSources';

export const PostProcessingShader = new GLSLSources(
    'PostProcessingShader',
    require('./glsl/post_process.vert'),
    require('./glsl/post_process.frag')
);
