import {arrayify} from 'tslint/lib/utils';
import {TPAssert, TPException} from '../error/TPException';

export class Mat4 {

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
        const fovRadians = fov * Math.PI / 180.0;
        const f = 1.0 * Math.tan(fovRadians);
        const distInv = 1.0 / (near - far);
        return new Mat4([
            f / ar,  0, 0, 0,
                 0,  f, 0, 0,
                 0,  0, (near + far) * distInv, -1,
            0, 0, 2.0 * far * near * distInv, 0
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

    static multiply(...mats: Mat4[]): Mat4 {
        TPAssert(mats.length > 0, 'Multiply requires at least 1 Matrix.');
        const result = mats[0].copy();
        mats.slice(1);
        for (const other of mats) {
            result.mul(other);
        }
        return result;
    }

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

        TPAssert(data.length == 16, 'Invalid size Mat4 data must be length 16.');
        this.array = new Float32Array(data);
    }

    copy(): Mat4 {
        const numberArray = Array.prototype.slice.call(this.array);
        return new Mat4(numberArray);
    }

    get(row: number, col: number): number {
        return this.array[row * 4 + col];
    }

    set(row: number, col: number, value: number) {
        this.array[row * 4 + col] = value;
    }

    setAll(data: number[]) {
        this.array = new Float32Array(data);
    }

    mul(other: Mat4): Mat4 {

        const a00 = this.get(0, 0);
        const a01 = this.get(0, 1);
        const a02 = this.get(0, 2);
        const a03 = this.get(0, 3);
        const a10 = this.get(1, 0);
        const a11 = this.get(1, 1);
        const a12 = this.get(1, 2);
        const a13 = this.get(1, 3);
        const a20 = this.get(2, 0);
        const a21 = this.get(2, 1);
        const a22 = this.get(2, 2);
        const a23 = this.get(2, 3);
        const a30 = this.get(3, 0);
        const a31 = this.get(3, 1);
        const a32 = this.get(3, 2);
        const a33 = this.get(3, 3);

        const b00 = other.get(0, 0);
        const b01 = other.get(0, 1);
        const b02 = other.get(0, 2);
        const b03 = other.get(0, 3);
        const b10 = other.get(1, 0);
        const b11 = other.get(1, 1);
        const b12 = other.get(1, 2);
        const b13 = other.get(1, 3);
        const b20 = other.get(2, 0);
        const b21 = other.get(2, 1);
        const b22 = other.get(2, 2);
        const b23 = other.get(2, 3);
        const b30 = other.get(3, 0);
        const b31 = other.get(3, 1);
        const b32 = other.get(3, 2);
        const b33 = other.get(3, 3);

        const res00 = a00 * b00 + a01 * b10 + a02 * b20 + a03 * b30;
        const res01 = a00 * b01 + a01 * b11 + a02 * b21 + a03 * b31;
        const res02 = a00 * b02 + a01 * b12 + a02 * b22 + a03 * b32;
        const res03 = a00 * b03 + a01 * b13 + a02 * b23 + a03 * b33;
        const res10 = a10 * b00 + a11 * b10 + a12 * b20 + a13 * b30;
        const res11 = a10 * b01 + a11 * b11 + a12 * b21 + a13 * b31;
        const res12 = a10 * b02 + a11 * b12 + a12 * b22 + a13 * b32;
        const res13 = a10 * b03 + a11 * b13 + a12 * b23 + a13 * b33;
        const res20 = a20 * b00 + a21 * b10 + a22 * b20 + a23 * b30;
        const res21 = a20 * b01 + a21 * b11 + a22 * b21 + a23 * b31;
        const res22 = a20 * b02 + a21 * b12 + a22 * b22 + a23 * b32;
        const res23 = a20 * b03 + a21 * b13 + a22 * b23 + a23 * b33;
        const res30 = a30 * b00 + a31 * b10 + a32 * b20 + a33 * b30;
        const res31 = a30 * b01 + a31 * b11 + a32 * b21 + a33 * b31;
        const res32 = a30 * b02 + a31 * b12 + a32 * b22 + a33 * b32;
        const res33 = a30 * b03 + a31 * b13 + a32 * b23 + a33 * b33;

        const data = [
            res00, res01, res02, res03,
            res10, res11, res12, res13,
            res20, res21, res22, res23,
            res30, res31, res32, res33,
        ];

        this.setAll(data);
        return this;
    }
}
