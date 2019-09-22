import {vec2} from 'gl-matrix';

export abstract class GraphData {

    abstract getCount(): number;

    abstract getValue(id: number): number;

    abstract getNeighbours(id: number): Array<number>;

    abstract getPosition(id: number): vec2;

    abstract getName(id: number): string;

}
