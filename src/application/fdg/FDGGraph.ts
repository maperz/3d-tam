import {vec2} from "gl-matrix";
import {TPAssert} from '../../engine/error/TPException';
import {FDGEdge} from './FDGEdge';
import {FDGNode} from './FDGNode';

export class FDGGraph {

    edges: FDGEdge[] = [];
    nodes: FDGNode[] = [];


    static create(connectionMatrix : boolean[][], min: vec2, max: vec2) : FDGGraph {
        let graph = new FDGGraph()

        const diff = vec2.sub(vec2.create(), max, min);

        for(let i = 0; i < connectionMatrix.length; i++) {

            let pos = vec2.fromValues(Math.random(), Math.random());

            vec2.mul(pos, pos, diff);

            vec2.add(pos, pos, min);

            let node = new FDGNode(pos);

            //node.force = vec2.random(vec2.create());

            graph.nodes.push(node);
        }

        for(let i = 0; i < connectionMatrix.length; i++) {
            let connections = connectionMatrix[i];
            TPAssert(connections.length == connectionMatrix.length, "Connection Matrix must be of type NxN");
            for(let k = i + 1; k < connections.length; k++) {
                if(connections[k]) {
                    const edge = new FDGEdge(graph.nodes[i], graph.nodes[k])
                    graph.nodes[i].addEdge(edge);
                    graph.nodes[k].addEdge(edge);
                    graph.edges.push(edge);
                }
            }
        }

        return graph;
    }

}
