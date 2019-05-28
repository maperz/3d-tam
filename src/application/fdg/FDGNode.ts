import {vec2} from 'gl-matrix';
import {FDGEdge} from './FDGEdge';

export class FDGNode {

    position: vec2;
    force: vec2;

    edges: FDGEdge[] = [];

    constructor(pos: vec2) {
        this.position = vec2.copy(vec2.create(), pos);
        this.force = vec2.fromValues(0, 0);
    }

    updatePosition(dt: number) {
        const scaledForce = vec2.create();
        // vec2.normalize(scaledForce, this.force);
        vec2.scale(scaledForce, this.force  , dt * 15);
        vec2.add(this.position, this.position, scaledForce);
    }

    addForce(deltaForce: vec2) {
        vec2.add(this.force, this.force, deltaForce);
    }

    addEdge(edge: FDGEdge) {
        this.edges.push(edge);
    }
}
