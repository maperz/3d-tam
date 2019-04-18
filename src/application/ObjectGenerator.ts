export class ObjectGenerator {


    static generateGridData(numTilesX: number, numTilesY: number, sizeX: number, sizeY: number, lines: boolean = false): [number[], number[]] {

        const vertecies = [];
        const indices = [];

        numTilesX = Math.floor(numTilesX);
        numTilesY = Math.floor(numTilesY);

        const halfTilesX = numTilesX / 2.0;
        const halfTilesY = numTilesY / 2.0;

        const offsetX = -halfTilesX * sizeX;
        const offsetY = -halfTilesY * sizeY;

        // Add + 1 because total num quads + 1 = num verts
        const numVertsX = numTilesX + 1;
        const numVertsY = numTilesY + 1;

        for (let x = 0; x < numVertsX; ++x) {
            for (let y = 0; y < numVertsY; ++y) {
                const posX = offsetX + x * sizeX;
                const posY = offsetY + y * sizeY;
                vertecies.push(posX, 0.0, posY);
            }
        }


        for (let y = 0; y < numTilesY; ++y) {
            for (let x = 0; x < numTilesX; ++x) {
                const i = x + numVertsY * y;
                const iPlusRow = i + numVertsY;
                indices.push(i, iPlusRow, i + 1);
                indices.push(iPlusRow, iPlusRow + 1, i + 1);

                if (lines) {
                    indices.push(i, iPlusRow + 1);
                    indices.push(iPlusRow, iPlusRow + 1);
                    indices.push(i, i + 1);
                }
            }
        }

        return [vertecies, indices];
    }


    static generateCube(size: number) : [number[], number[]] {
        const d = size;
        const vertices = [
            -d, -d, -d, d, -d, -d, d, d, -d, -d, d, -d,
            -d, -d, d, d, -d, d, d, d, d, -d, d, d,
            -d, -d, -d, -d, d, -d, -d, d, d, -d, -d, d,
            d, -d, -d, d, d, -d, d, d, d, d, -d, d,
            -d, -d, -d, -d, -d, d, d, -d, d, d, -d, -d,
            -d, d, -d, -d, d, d, d, d, d, d, d, -d,
        ];

        const indices = [
            0, 1, 2, 0, 2, 3,
            4, 5, 6, 4, 6, 7,
            8, 9, 10, 8, 10, 11,
            12, 13, 14, 12, 14, 15,
            16, 17, 18, 16, 18, 19,
            20, 21, 22, 20, 22, 23
        ];

        return [vertices, indices]
    }
}
