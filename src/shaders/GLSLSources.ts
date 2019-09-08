export class GLSLSources {
    constructor(public name: string,
                public vertexSource: string | null,
                public fragmentSource: string | null,
                public computeSource: string | null = null) {}
}
