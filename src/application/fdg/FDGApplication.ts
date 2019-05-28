import {GUI} from 'dat.gui';
import {vec2} from 'gl-matrix';
import {CanvasApplication} from '../../engine/application/CanvasApplication';
import {canvas, ctx} from '../../engine/Context';
import {FDGEdge} from './FDGEdge';
import {FDGGraph} from './FDGGraph';
import {FDGNode} from './FDGNode';
import {FDGSolver} from './FDGSolver';

export class FDGApplication extends CanvasApplication {

    private static CONNECTION_MATRIX = [
        [true, true, false, false, false],
        [true, true, false, false, true],
        [false, false, true, false, true],
        [false, false, false, true, true],
        [false, false, true, true, true]
    ];

    readonly BACKGROUND_COLOR = '#e2e2e2';

    readonly NODE_RADIUS = 10;

    graph: FDGGraph;
    solver: FDGSolver;

    settings = {
        animated : false,
        iterations: 1000,
        reset: () => {
            this.resetGraph();
        }
    };

    readonly MARGIN = 300;

    onStart(): void {
        canvas.style.backgroundColor = this.BACKGROUND_COLOR;
        this.resetGraph();
        this.initGUI();
    }

    resetGraph() {
        this.graph = FDGGraph.create(FDGApplication.CONNECTION_MATRIX,
            vec2.fromValues(this.MARGIN, this.MARGIN),
            vec2.fromValues(canvas.width - this.NODE_RADIUS * 2 - this.MARGIN,
                canvas.height - this.NODE_RADIUS * 2 - this.MARGIN));

        this.solver = new FDGSolver(this.graph);

        if (!this.settings.animated) {
            this.solver.simulate(this.settings.iterations);
        }
    }

    initGUI(): void {
        const gui: GUI = new GUI({width: 300});

        gui.remember(this.settings);
        gui.add(this.settings, 'animated');
        gui.add(this.settings, 'iterations');
        gui.add(this.settings, 'reset');

    }

    onUpdate(deltaTime: number): void {
        if (this.settings.animated) {
            this.solver.simulate(1, deltaTime);
        }
        this.drawGraph();
    }

    drawGraph() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        ctx.fillStyle = '#FFFFFF';

        ctx.beginPath();
        this.graph.edges.forEach((edge: FDGEdge) => {
            const first = edge.nodes[0];
            const second = edge.nodes[1];
            ctx.moveTo(first.position[0], first.position[1]);
            ctx.lineTo(second.position[0], second.position[1]);
        });
        ctx.stroke();

        this.graph.nodes.forEach((node: FDGNode) => {
            ctx.beginPath();
            ctx.arc(node.position[0], node.position[1], this.NODE_RADIUS, 0, 2 * Math.PI);
            ctx.fill();
            ctx.stroke();
        });
    }
}
