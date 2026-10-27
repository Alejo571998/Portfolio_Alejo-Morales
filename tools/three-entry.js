// Única puerta de entrada a three.js para el sitio.
// Exportar solo lo que usan js/gl/*.js: esbuild descarta el resto (tree-shaking).
export {
  ACESFilmicToneMapping,
  AnimationMixer,
  BackSide,
  BufferAttribute,
  BufferGeometry,
  CanvasTexture,
  Color,
  DirectionalLight,
  FrontSide,
  Group,
  HemisphereLight,
  LoopOnce,
  MathUtils,
  Matrix3,
  Mesh,
  MeshBasicMaterial,
  PerspectiveCamera,
  PlaneGeometry,
  PMREMGenerator,
  Scene,
  ShaderMaterial,
  SphereGeometry,
  SRGBColorSpace,
  Vector2,
  Vector3,
  WebGLRenderer,
} from 'three';
export { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
export { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';
