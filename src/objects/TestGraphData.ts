import {vec2} from 'gl-matrix';
import {GraphData} from './GraphData';

export class TestGraphData extends GraphData {

    readonly neightbours = [
        // TODO: Enter 10 correct neighbours
    ];


    readonly values = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

    readonly positions = [
        vec2.fromValues(500, 500),
        vec2.fromValues(400, 400),
        vec2.fromValues(300, 300),
        vec2.fromValues(500, 300),
        vec2.fromValues(400, 500),
        vec2.fromValues(300, 600),
        vec2.fromValues(600, 500),
        vec2.fromValues(300, 400),
        vec2.fromValues(600, 300),
        vec2.fromValues(650, 450)
    ];

    getNeighbours(id: number): Array<number> {
        return this.neightbours[id];
    }

    getCount(): number {
        return this.neightbours.length;
    }

    getPosition(id: number): vec2 {
        return this.positions[id];
    }

    getValue(id: number): number {
        return this.values[id];
    }

}
