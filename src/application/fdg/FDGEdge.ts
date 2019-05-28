import {FDGNode} from './FDGNode';

export class FDGEdge {
    nodes: [FDGNode, FDGNode];

    constructor(public first: FDGNode, public second: FDGNode) {
        this.nodes = [first, second];
    }

}
