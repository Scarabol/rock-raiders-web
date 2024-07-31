const GreenScaleShader = {
    name: 'GreenScaleShader',
    uniforms: {
        'tDiffuse': {value: null as never},
    },
    vertexShader: /* glsl */`
            varying vec2 vUv;
            void main() {
                vUv = uv;
                gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
            }`,
    fragmentShader: /* glsl */`
            uniform sampler2D tDiffuse;
            varying vec2 vUv;
            void main() {
                vec4 base = texture2D( tDiffuse, vUv );
                float gray = 0.21 * base.r + 0.71 * base.g + 0.07 * base.b;
                gl_FragColor = vec4( 0.0, gray, 0.0, base.a );
            }`,
}

export { GreenScaleShader }
