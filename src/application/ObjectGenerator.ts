export class ObjectGenerator {

    static generateGridData(numTilesX: number, numTilesY: number, sizeX: number, sizeY: number): [Float32Array, Int32Array] {

        const resultData = [];
        const indicesData = [];

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
                resultData.push(posX, 0.0, posY);
            }
        }

        for (let x = 0; x < numTilesX; ++x) {
            for (let y = 0; y < numTilesY; ++y) {
                const xPlusRow = x + numVertsY;
                indicesData.push(x, xPlusRow, x + 1);
                indicesData.push(xPlusRow, xPlusRow + 1, x + 1);
            }
        }

        return [new Float32Array(resultData), new Int32Array(indicesData)];
    }

}
