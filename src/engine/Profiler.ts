import {TPAssert} from './error/TPException';

enum ProfilingState {
    Created,
    Started,
    Stopped,
}

class ProfilingSession {

    state = ProfilingState.Created;
    started: number;
    stopped: number;

    parent?: ProfilingSession = null;
    children: ProfilingSession[] = [];

    constructor(public title: string) {}

    public start() {
        TPAssert(this.state == ProfilingState.Created, "[Profiler] Attempt to restart session");
        this.state = ProfilingState.Started;
        this.started = performance.now();
    }

    public stop() {
        TPAssert(this.state == ProfilingState.Started, "[Profiler] Attempt to stop not running session");
        this.state = ProfilingState.Stopped;
        this.stopped = performance.now();
    }

    public addChildSession(session: ProfilingSession) {
        session.parent = this;
        this.children.push(session);
    }

    public duration() {
        TPAssert(this.state == ProfilingState.Stopped, "[Profiler] Attempt to get duration unstopped session");
        return this.stopped - this.started;
    }
}

export class Profiler {

    private static currentSession: ProfilingSession = null;

    private static pushSession(session: ProfilingSession) {
        if(this.currentSession != null) {
            this.currentSession.addChildSession(session);
        }
        this.currentSession = session;
    }

    private static popSession() {
        if(this.currentSession.parent != null) {
            this.currentSession = this.currentSession.parent;   
        }
        else {
            this.printTree();
            this.currentSession = null;
        }
    }

    static startSession(title: string) {
        const session = new ProfilingSession(title);
        this.pushSession(session);
        session.start();
    }

    static stopSession() {
        this.currentSession.stop();
        this.popSession();
    }

    static evaluate(title: string, fn: Function) {
        this.startSession(title);
        const res = fn();
        this.stopSession();
        return res;
    }

    private static printNode(session: ProfilingSession, level = 0){
        const ws = ' '.repeat(level);
        console.log(`${ws}[${session.title}]: ${session.duration()}ms`)
        for(const s of session.children) {
            this.printNode(s, level+1);
        }
    }

    private static printTree() {
        if(!this.currentSession) {
            console.log("Profiler did not run. Cannot print Tree");
            return;
        }

        TPAssert(this.currentSession.parent == null && this.currentSession.state == ProfilingState.Stopped,
            'Can not print tree if profiling is still running');
        this.printNode(this.currentSession);
    }

}
