# Raytracing in plain Javascript

Implemented simple raytracing in Javascript.

Rendering is done using Web Worker.

![result render](.img/screen.png "Result render")

## Start

Opening `index.html` in browser is not enough, because of the webworker using other script (fails on CORS).

Open `index.html` in simple http server.

## Supported materials

- Lambertian
- Metal
- Dielectric

## Thanks to

Implementation follows books [Raytracing in one weekend](https://raytracing.github.io/), thanks to the author.
