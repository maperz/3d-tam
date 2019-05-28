import {Shader} from '../engine/Shader';

export interface IRenderable {

    init(shader: Shader): void;
    draw(shader: Shader): void;
}
