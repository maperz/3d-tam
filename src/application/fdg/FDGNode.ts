import {vec2} from 'gl-matrix';

export class Node {

    position : vec2;
    force: vec2;

    constructor(position: vec2) {
        this.position = position;
        this.force = new vec2([0, 0]);
    }

    updatePosition(dt: number) {
        let scaledForce = vec2.create();
        vec2.normalize(scaledForce, this.force);
        vec2.scale(scaledForce, scaledForce, dt);
        vec2.add(this.position, this.position, scaledForce);
    }

}
