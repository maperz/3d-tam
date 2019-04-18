import {TPAssert, TPException} from '../error/TPException';

export class Mat4 {

    private array: Float32Array;

    constructor(data?: number[]) {
        if (data == null) {
            data = [
                0.0, 0.0, 0.0, 0.0,
                0.0, 0.0, 0.0, 0.0,
                0.0, 0.0, 0.0, 0.0,
                0.0, 0.0, 0.0, 0.0,
            ];
        }

        TPAssert(data.length == 16, "Invalid size Mat4 data must be length 16.");
        this.array = new Float32Array(data);
    }

    get data(): Float32Array {
        return this.array;
    }

    static rotationX(alpha: number): Mat4 {
        return new Mat4([
            1.0,             0.0,              0.0, 0.0,
            0.0, Math.cos(alpha), -Math.sin(alpha), 0.0,
            0.0, Math.sin(alpha),  Math.cos(alpha), 0.0,
            0.0,             0.0,              0.0, 1.0
        ]);
    }

    static rotationY(alpha: number): Mat4 {
        return new Mat4([
             Math.cos(alpha),  0.0,  Math.sin(alpha), 0.0,
                         0.0,  1.0,              0.0, 0.0,
            -Math.sin(alpha),  0.0,  Math.cos(alpha), 0.0,
                         0.0,  0.0,              0.0, 1.0
        ]);
    }

    static rotationZ(alpha: number): Mat4 {
        return new Mat4([
            Math.cos(alpha), -Math.sin(alpha), 0.0,  0.0,
            Math.sin(alpha),  Math.cos(alpha), 0.0,  0.0,
                        0.0,               0.0, 1.0, 0.0,
                        0.0,               0.0, 0.0, 1.0
        ]);
    }

    // Perspective matrix adapted from
    // https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/WebGL_model_view_projection
    static perspective(fov, ar, near, far) {

        const fov_radians = fov * Math.PI / 180.0;
        const f = 1.0 * Math.tan(fov_radians);
        const dist_inv = 1.0 / (near - far);
        return new Mat4([
            f / ar,  0, 0, 0,
                 0,  f, 0, 0,
                 0,  0, (near + far) * dist_inv, -1,
            0, 0, 2.0 * far * near * dist_inv, 0
        ]);
    }

    static scale(scale = 1.0) {
        return new Mat4([
            scale,   0.0,   0.0, 0.0,
              0.0, scale,   0.0, 0.0,
              0.0,   0.0, scale, 0.0,
              0.0,   0.0,   0.0, 1.0,
        ]);
    }

    static identity(val = 1.0) {
        return new Mat4([
            val, 0.0, 0.0, 0.0,
            0.0, val, 0.0, 0.0,
            0.0, 0.0, val, 0.0,
            0.0, 0.0, 0.0, val,
        ]);
    }

    static translate(x: number, y: number, z: number) {
        return new Mat4([
            1.0, 0.0, 0.0, 0.0,
            0.0, 1.0, 0.0, 0.0,
            0.0, 0.0, 1.0, 0.0,
              x,   y,   z, 1.0,
        ]);
    }


}
