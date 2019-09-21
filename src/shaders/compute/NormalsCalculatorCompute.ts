import {GLSLSources} from '../GLSLSources';

export const NormalsCalculatorCompute = new GLSLSources(
    'NormalsCalculatorCompute',
    null,
    null,
    require('./glsl/normalscalc.glsl')
);
