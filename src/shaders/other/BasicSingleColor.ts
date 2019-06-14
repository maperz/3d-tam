import {GLSLSources} from '../GLSLSources';

export const BasicShaderSingleColor = new GLSLSources(
    'BasicShaderSingleColor',
    require('./glsl/basic_single_color.vert'),
    require('./glsl/basic_single_color.frag')
);
