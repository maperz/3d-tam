import {GLSLSources} from '../GLSLSources';

export const BasicCube = new GLSLSources(
    'BasicCube',
    require('./glsl/basic_cube.vert'),
    require('./glsl/basic_cube.frag')
);
