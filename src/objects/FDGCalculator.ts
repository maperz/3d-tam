import {TPAssert} from '../engine/error/TPException';
import {Shader} from '../engine/Shader';
import {createShaderFromSources} from '../engine/utils/Utils';
import {AttractionCompute} from '../shaders/compute/AttractionCompute';
import {PositionUpdateCompute} from '../shaders/compute/PositionUpdateCompute';

export class FDGCalculator {

    initialized = false;

    attractionShader : Shader;
    updateShader: Shader;

    init() {
        this.attractionShader = createShaderFromSources(AttractionCompute);
        this.updateShader = createShaderFromSources(PositionUpdateCompute);
        this.initialized = true;
    }
    
    updatePositions() {
        TPAssert(this.initialized, 'FDGCalculator needs to be initialized first before usage.');
    }
}
