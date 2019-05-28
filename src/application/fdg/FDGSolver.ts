import {vec2} from 'gl-matrix';
import {FDGEdge} from './FDGEdge';
import {FDGGraph} from './FDGGraph';
import {FDGNode} from './FDGNode';

export class FDGSolver {

    readonly EDGE_LENGTH = 100;
    readonly SPRING_STIFFNESS = 0.1;
    readonly FORCE_BOUNCE = 1;

    constructor(private graph: FDGGraph) {
    }

    simulate(amount: number, deltaTime: number = 0.16) {
        for (let i = 0; i < amount; ++i) {
            this.iterate(deltaTime);
        }
    }

    private iterate(deltaTime: number) {
        this.graph.nodes.forEach((node: FDGNode) => {

            node.force = vec2.create();
            this.graph.nodes.forEach((other: FDGNode) => {
                if (other === node ) {
                    return; // Continue
                }

                let hasEdge = false;
                node.edges.forEach((edge: FDGEdge) => {
                    hasEdge = edge.nodes.includes(other);
                    if (hasEdge) {
                        return;
                    }
                });

                if (hasEdge) {
                    // Compute force based on spring mechanics
                    // k*(distance(A,B)-SpringLength)

                    const forceSize = this.SPRING_STIFFNESS *
                        (vec2.dist(node.position, other.position) - this.EDGE_LENGTH);
                    const force = vec2.sub(vec2.create(), other.position, node.position);
                    vec2.normalize(force, force);
                    vec2.scale(force, force, forceSize);
                    node.addForce(force);
                } else {
                    const dir = vec2.sub(vec2.create(), node.position, other.position);
                    const forceSize = this.FORCE_BOUNCE;
                    vec2.normalize(dir, dir);
                    vec2.scale(dir, dir, forceSize);
                    node.addForce(dir);
                }
            });
        });

        const pivot = this.graph.nodes[4];
        pivot.force = vec2.create();

        this.graph.nodes.forEach((node: FDGNode) => {
            node.updatePosition(deltaTime);
        });
    }

}
