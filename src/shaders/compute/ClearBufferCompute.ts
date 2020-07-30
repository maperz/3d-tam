import {GLSLSources} from '../GLSLSources';

export const ClearBufferCompute = new GLSLSources(
    'ClearBufferCompute',
    null,
    null,
    require('./glsl/clear_buffer.glsl')
);
