
export class PixelGrid {

    private readonly vertices = new Array<Float32Array>();
    private readonly indices = new Array<Uint16Array>();
    private readonly pixels = new Array<Float32Array>();
    private readonly chunkCount: number;

    private readonly MAX_INDICES_PER_CHUNK = 2 ** 16 - 10; // - 10 For Tolerance
    // private readonly MAX_INDICES_PER_CHUNK  = 40;

    private readonly tileSizeX: number;
    private readonly tileSizeY: number;

    constructor(private width: number,
                private height: number,
                private tilesX: number,
                private tilesY: number) {

        this.tileSizeX = width / (tilesX - 1);
        this.tileSizeY = height / (tilesY - 1);

        const indicesPerTile = 6;
        const tilesPerRow = (tilesX - 1);
        const indicesPerRow = indicesPerTile * tilesPerRow;

        const rowsPerChunk = Math.floor(this.MAX_INDICES_PER_CHUNK / indicesPerRow);
        const totalRows = tilesY;

        this.chunkCount = Math.ceil(totalRows / rowsPerChunk);

        let startRow = 0;
        for (let chunk = 0; chunk < this.chunkCount; chunk++) {
            const endRow = Math.min(startRow + rowsPerChunk, totalRows - 1);
            this.createChunk(startRow, endRow);
            startRow = endRow;
        }
    }

    getChunkCount(): number {
        return this.chunkCount;
    }

    getVertices(): Float32Array[] {
        return this.vertices;
    }

    getIndices(): Uint16Array[] {
        return this.indices;
    }

    getPixels(): Float32Array[] {
        return this.pixels;
    }

    private createChunk(startRow: number, endRow: number) {
        // console.log('Creating chunk from ' + startRow + ' to ' + endRow);
        const vertices: number[] = [];
        const indices: number[] = [];
        const pixels: number[] = [];

        const offsetX = -this.width / 2.0;
        const offsetY = -this.height / 2.0;

        for (let y = startRow; y <= endRow; ++y) {
            for (let x = 0; x < this.tilesX; ++x) {
                const positionX = offsetX + x * this.tileSizeX;
                const positionY = offsetY + y * this.tileSizeY;
                vertices.push(positionX, positionY);
                pixels.push(x / this.tilesX, y / this.tilesY);
            }
        }

        const numRows = endRow - startRow;
        for (let y = 0; y < numRows; ++y) {
            for (let x = 0; x < this.tilesX - 1; ++x) {
                const i = x + this.tilesX * y;
                const iPlusRow = i + this.tilesX;

                // TODO: This is incomplete
                indices.push(i);
                indices.push(i + 1);
                indices.push(iPlusRow);

                indices.push(i + 1);
                indices.push(iPlusRow + 1);
                indices.push(iPlusRow);

                //indices.push(iPlusRow, i + 1);
                // indices.push(iPlusRow, iPlusRow + 1);
                // indices.push(iPlusRow + 1, i + 1);
            }
        }

        this.vertices.push(new Float32Array(vertices));
        this.indices.push(new Uint16Array(indices));
        this.pixels.push(new Float32Array(pixels));
    }

}
