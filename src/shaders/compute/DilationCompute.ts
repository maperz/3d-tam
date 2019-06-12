import {GLSLSources} from '../GLSLSources';

export const DilationCompute = new GLSLSources(
    "DilationCompute",
    null,
    null,
    require("./glsl/dilation.glsl")
);
