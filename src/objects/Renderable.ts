import {Shader} from '../engine/Shader';

export interface Renderable {

    init(shader: Shader): void;
    draw(shader: Shader): void;
}
