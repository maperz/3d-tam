import {GLSLSources} from '../GLSLSources';

export const ScreenPositionCompute = new GLSLSources(
    'ScreenPositionCompute',
    null,
    null,
    require('./glsl/screen_position.glsl')
);
