import * as THREE from 'three';
import { BlockType } from '../types/game';
import { BLOCK_PROPERTIES, CHUNK_SIZE_X, CHUNK_SIZE_Y, CHUNK_SIZE_Z } from './constants';
import { getBlockMaterials } from './textures';

// 6 Faces definitions: [dx, dy, dz, normal, uvs, vertices]
const FACES = [
  // 0: Right (+X)
  {
    dir: [1, 0, 0],
    matIdx: 0,
    corners: [
      [1, 0, 0],
      [1, 1, 0],
      [1, 1, 1],
      [1, 0, 1],
    ],
    normal: [1, 0, 0],
  },
  // 1: Left (-X)
  {
    dir: [-1, 0, 0],
    matIdx: 1,
    corners: [
      [0, 0, 1],
      [0, 1, 1],
      [0, 1, 0],
      [0, 0, 0],
    ],
    normal: [-1, 0, 0],
  },
  // 2: Top (+Y)
  {
    dir: [0, 1, 0],
    matIdx: 2,
    corners: [
      [0, 1, 1],
      [1, 1, 1],
      [1, 1, 0],
      [0, 1, 0],
    ],
    normal: [0, 1, 0],
  },
  // 3: Bottom (-Y)
  {
    dir: [0, -1, 0],
    matIdx: 3,
    corners: [
      [0, 0, 0],
      [1, 0, 0],
      [1, 0, 1],
      [0, 0, 1],
    ],
    normal: [0, -1, 0],
  },
  // 4: Front (+Z)
  {
    dir: [0, 0, 1],
    matIdx: 4,
    corners: [
      [1, 0, 1],
      [1, 1, 1],
      [0, 1, 1],
      [0, 0, 1],
    ],
    normal: [0, 0, 1],
  },
  // 5: Back (-Z)
  {
    dir: [0, 0, -1],
    matIdx: 5,
    corners: [
      [0, 0, 0],
      [0, 1, 0],
      [1, 1, 0],
      [1, 0, 0],
    ],
    normal: [0, 0, -1],
  },
];

export class Chunk {
  public chunkX: number;
  public chunkZ: number;
  public data: Uint8Array;
  public mesh: THREE.Group | null = null;
  public isDirty: boolean = true;

  constructor(chunkX: number, chunkZ: number, data: Uint8Array) {
    this.chunkX = chunkX;
    this.chunkZ = chunkZ;
    this.data = data;
  }

  public getIndex(x: number, y: number, z: number): number {
    return x + y * CHUNK_SIZE_X + z * CHUNK_SIZE_X * CHUNK_SIZE_Y;
  }

  public getBlock(x: number, y: number, z: number): BlockType {
    if (x < 0 || x >= CHUNK_SIZE_X || y < 0 || y >= CHUNK_SIZE_Y || z < 0 || z >= CHUNK_SIZE_Z) {
      return BlockType.AIR;
    }
    return this.data[this.getIndex(x, y, z)];
  }

  public setBlock(x: number, y: number, z: number, type: BlockType): void {
    if (x < 0 || x >= CHUNK_SIZE_X || y < 0 || y >= CHUNK_SIZE_Y || z < 0 || z >= CHUNK_SIZE_Z) return;
    this.data[this.getIndex(x, y, z)] = type;
    this.isDirty = true;
  }

  // Build optimized mesh with neighbor block checks
  public buildMesh(getNeighborBlock: (wx: number, wy: number, wz: number) => BlockType): THREE.Group {
    const group = new THREE.Group();
    const worldBaseX = this.chunkX * CHUNK_SIZE_X;
    const worldBaseZ = this.chunkZ * CHUNK_SIZE_Z;

    // Per-block mesh geometry buffers
    const blockBuffers: Map<
      BlockType,
      {
        positions: number[];
        normals: number[];
        uvs: number[];
        colors: number[];
        indices: number[];
        indexOffset: number;
      }
    > = new Map();

    const getBuffer = (type: BlockType) => {
      let b = blockBuffers.get(type);
      if (!b) {
        b = { positions: [], normals: [], uvs: [], colors: [], indices: [], indexOffset: 0 };
        blockBuffers.set(type, b);
      }
      return b;
    };

    const isBlockTransparent = (type: BlockType) => {
      if (type === BlockType.AIR) return true;
      const prop = BLOCK_PROPERTIES[type];
      return prop ? prop.transparent : false;
    };

    for (let y = 0; y < CHUNK_SIZE_Y; y++) {
      for (let z = 0; z < CHUNK_SIZE_Z; z++) {
        for (let x = 0; x < CHUNK_SIZE_X; x++) {
          const block = this.getBlock(x, y, z);
          if (block === BlockType.AIR) continue;

          const isCurrentTransparent = isBlockTransparent(block);

          // Check 6 neighboring faces
          for (let f = 0; f < 6; f++) {
            const face = FACES[f];
            const nx = x + face.dir[0];
            const ny = y + face.dir[1];
            const nz = z + face.dir[2];

            let neighborBlock: BlockType;
            if (nx >= 0 && nx < CHUNK_SIZE_X && ny >= 0 && ny < CHUNK_SIZE_Y && nz >= 0 && nz < CHUNK_SIZE_Z) {
              neighborBlock = this.getBlock(nx, ny, nz);
            } else {
              neighborBlock = getNeighborBlock(worldBaseX + nx, ny, worldBaseZ + nz);
            }

            // Decide face visibility:
            let renderFace = false;
            if (neighborBlock === BlockType.AIR) {
              renderFace = true;
            } else if (isBlockTransparent(neighborBlock) && neighborBlock !== block) {
              renderFace = true;
            }

            // Don't render internal water faces
            if (block === BlockType.WATER && neighborBlock === BlockType.WATER) {
              renderFace = false;
            }

            if (renderFace) {
              const buf = getBuffer(block);

              // Calculate basic directional face shading / ambient occlusion
              let faceLight = 1.0;
              if (face.dir[1] === 1) faceLight = 1.0; // Top
              else if (face.dir[1] === -1) faceLight = 0.55; // Bottom
              else if (face.dir[0] !== 0) faceLight = 0.8; // X sides
              else faceLight = 0.7; // Z sides

              const baseIdx = buf.indexOffset;

              // 4 corners of the quad
              for (let c = 0; c < 4; c++) {
                const corner = face.corners[c];
                buf.positions.push(x + corner[0], y + corner[1], z + corner[2]);
                buf.normals.push(face.normal[0], face.normal[1], face.normal[2]);

                buf.colors.push(faceLight, faceLight, faceLight);
              }

              // Standard UVs: (0,0), (1,0), (1,1), (0,1)
              buf.uvs.push(0, 0, 1, 0, 1, 1, 0, 1);

              // Two triangles for the quad
              buf.indices.push(baseIdx, baseIdx + 1, baseIdx + 2);
              buf.indices.push(baseIdx, baseIdx + 2, baseIdx + 3);

              buf.indexOffset += 4;
            }
          }
        }
      }
    }

    const materials = getBlockMaterials();

    // Create meshes for each block type in this chunk
    blockBuffers.forEach((buf, blockType) => {
      if (buf.positions.length === 0) return;

      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute('position', new THREE.Float32BufferAttribute(buf.positions, 3));
      geometry.setAttribute('normal', new THREE.Float32BufferAttribute(buf.normals, 3));
      geometry.setAttribute('color', new THREE.Float32BufferAttribute(buf.colors, 3));
      geometry.setAttribute('uv', new THREE.Float32BufferAttribute(buf.uvs, 2));
      geometry.setIndex(buf.indices);

      let mat = materials.get(blockType);
      if (!mat) {
        mat = new THREE.MeshLambertMaterial({ color: 0x888888 });
      }

      let blockMesh: THREE.Mesh;
      if (Array.isArray(mat)) {
        // Multi-face material: construct multi-material mesh using face material groups
        // Re-bucket indices by face material index
        const subIndices: number[][] = [[], [], [], [], [], []];
        const numQuads = buf.indices.length / 6;

        for (let q = 0; q < numQuads; q++) {
          const v0 = buf.indices[q * 6];
          const nx = buf.normals[v0 * 3];
          const ny = buf.normals[v0 * 3 + 1];
          const nz = buf.normals[v0 * 3 + 2];

          let fIdx = 0;
          if (nx > 0.5) fIdx = 0;
          else if (nx < -0.5) fIdx = 1;
          else if (ny > 0.5) fIdx = 2; // Top
          else if (ny < -0.5) fIdx = 3; // Bottom
          else if (nz > 0.5) fIdx = 4;
          else if (nz < -0.5) fIdx = 5;

          for (let k = 0; k < 6; k++) {
            subIndices[fIdx].push(buf.indices[q * 6 + k]);
          }
        }

        const consolidatedIndices: number[] = [];
        geometry.clearGroups();
        for (let m = 0; m < 6; m++) {
          const start = consolidatedIndices.length;
          const count = subIndices[m].length;
          if (count > 0) {
            geometry.addGroup(start, count, m);
            consolidatedIndices.push(...subIndices[m]);
          }
        }
        geometry.setIndex(consolidatedIndices);
        blockMesh = new THREE.Mesh(geometry, mat);
      } else {
        blockMesh = new THREE.Mesh(geometry, mat);
      }

      blockMesh.castShadow = blockType !== BlockType.WATER && blockType !== BlockType.GLASS;
      blockMesh.receiveShadow = true;
      group.add(blockMesh);
    });

    group.position.set(worldBaseX, 0, worldBaseZ);
    this.mesh = group;
    this.isDirty = false;
    return group;
  }

  // Dispose chunk geometry and release WebGL resources
  public dispose(scene: THREE.Scene): void {
    if (this.mesh) {
      scene.remove(this.mesh);
      this.mesh.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.geometry.dispose();
        }
      });
      this.mesh = null;
    }
  }
}
