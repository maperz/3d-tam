
export class Mat3 {

    get data(): Float32Array {
        return this.array;
    }

    static rotationX(alpha: number): Mat3 {
        return new Mat3([
            1, 0, 0,
            0, Math.cos(alpha), -Math.sin(alpha),
            0, Math.sin(alpha),  Math.cos(alpha),
        ]);
    }

    static rotationY(alpha: number): Mat3 {
        return new Mat3([
            Math.cos(alpha), 0.0,  Math.sin(alpha),
            0.0, 1.0, 0.0,
            -Math.sin(alpha), 0.0, Math.cos(alpha)
        ]);
    }

    static rotationZ(alpha: number): Mat3 {
        return new Mat3([
            Math.cos(alpha), -Math.sin(alpha), 0.0,
            Math.sin(alpha),  Math.cos(alpha), 0.0,
            0.0,              0.0, 0.0

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
