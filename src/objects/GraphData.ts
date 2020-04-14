import {vec2} from 'gl-matrix';

export abstract class GraphData {

    abstract getCount(): number;

    abstract getValue(id: number): number;

    abstract getPosition(id: number): vec2;

    abstract getEdges(id: number): Array<number>;

    abstract getFamily(id: number): number;

    abstract getName(id: number): string;

    abstract getType(id: number): number 

}
