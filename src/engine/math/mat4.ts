
export class Mat4 {

    get data(): Float32Array {
        return this.array;
    }

    static rotationX(alpha: number): Mat4 {
        return new Mat4([
            1, 0, 0, 0,
            0, Math.cos(alpha), -Math.sin(alpha), 0,
            0, Math.sin(alpha),  Math.cos(alpha), 0,
            0, 0, 0, 1
        ]);
    }

    static rotationY(alpha: number): Mat4 {
        return new Mat4([
            Math.cos(alpha), 0.0,  Math.sin(alpha), 0,
            0.0, 1.0, 0.0, 0,
            -Math.sin(alpha), 0.0, Math.cos(alpha), 0,
            0, 0, 0, 1
        ]);
    }

    static rotationZ(alpha: number): Mat4 {
        return new Mat4([
            Math.cos(alpha), -Math.sin(alpha), 0.0, 0,
            Math.sin(alpha),  Math.cos(alpha), 0.0, 0,
            0.0, 0.0, 0.0, 0,
            0, 0, 0, 1
        ]);
    }

    // Perspective matrix adapted from
    // https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/WebGL_model_view_projection
    static perspective(angle, ar, near, far) {

        const ang = Math.tan((angle * .5) * Math.PI / 180); // angle*.5
        const neg_dist_inv = -1.0 / (far - near);
        return new Mat4([
            0.5 / ang, 0 , 0, 0,
            0, 0.5 * ar / ang, 0, 0,
            0, 0, (far + near) / (neg_dist_inv), -1,
            0, 0, (2 * far * near) / (neg_dist_inv), 0
        ]);
    }

    static identity() {
        return new Mat4([
            1.0, 0.0, 0.0, 0.0,
            0.0, 1.0, 0.0, 0.0,
            0.0, 0.0, 1.0, 0.0,
            0.0, 0.0, 0.0, 1.0,
        ]);
    }

    static translate(x: number, y: number, z: number) {
        return new Mat4([
            1.0, 0.0, 0.0, x,
            0.0, 1.0, 0.0, y,
            0.0, 0.0, 1.0, z,
            0.0, 0.0, 0.0, 1.0,
        ]);
    }

    private array: Float32Array;

    constructor(data?: number[]) {
        if (data == null) {
            data = [
                0.0, 0.0, 0.0,
                0.0, 0.0, 0.0,
                0.0, 0.0, 0.0
            ];
        }
        this.array = new Float32Array(data);
    }
}
