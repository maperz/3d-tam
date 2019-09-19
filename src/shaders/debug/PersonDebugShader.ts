import {GLSLSources} from '../GLSLSources';

export const PersonDebugShader = new GLSLSources(
    'PersonDebugShader',
    require('./glsl/persondebug.vert'),
    require('./glsl/persondebug.frag')
);
