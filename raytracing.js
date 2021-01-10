function clamp(x, min, max) {
  if (x < min) return min;
  if (x > max) return max;
  return x;
}

function randomRange(min, max) {
  return Math.random() * (max - min) + min;
}

class Vec3 {
  constructor(x, y, z) {
    this.x = x;
    this.y = y;
    this.z = z;
  }

  toString() {
    return `Vec3(${this.x}, ${this.y}, ${this.z})`;
  }

  lengthSquared() {
    return this.x * this.x + this.y * this.y + this.z * this.z;
  }

  length() {
    return Math.sqrt(this.lengthSquared());
  }

  add(vec) {
    return new Vec3(this.x + vec.x, this.y + vec.y, this.z + vec.z);
  }

  sub(vec) {
    return new Vec3(this.x - vec.x, this.y - vec.y, this.z - vec.z);
  }

  mul(vec) {
    return new Vec3(this.x * vec.x, this.y * vec.y, this.z * vec.z);
  }

  mulNum(n) {
    return new Vec3(this.x * n, this.y * n, this.z * n);
  }

  divNum(n) {
    return this.mulNum(1 / n);
  }

  dot(vec) {
    return this.x * vec.x + this.y * vec.y + this.z * vec.z;
  }

  cross(vec) {
    return new Vec3(
      this.y * vec.z - vec.y * this.z,
      this.z * vec.x - vec.z * this.x,
      this.x * vec.y - vec.x * this.y
    );
  }

  unit() {
    return this.divNum(this.length());
  }

  distance(vec) {
    return vec.sub(this).length();
  }

  static random(min, max) {
    return new Vec3(
      randomRange(min, max),
      randomRange(min, max),
      randomRange(min, max)
    );
  }

  static randomInUnitSphere() {
    while (true) {
      const v = Vec3.random(-1, 1);
      if (v.lengthSquared() >= 1) {
        continue;
      }
      return v;
    }
  }
}

class Ray {
  constructor(origin, dir) {
    this.origin = origin;
    this.dir = dir;
  }

  toString() {
    return `Ray(${this.origin}, ${this.dir})`;
  }

  at(t) {
    return this.origin.add(this.dir.mulNum(t));
  }
}

class HitData {
  constructor(at, normal, t, material) {
    this.at = at;
    this.normal = normal;
    this.t = t;
    this.material = material;
  }
}

class HitResult {
  constructor(isHit, data) {
    this.isHit = isHit;
    this.data = data;
  }

  static hit(ray, at, outNormal, t, material) {
    let normal;
    let isFront;
    if (ray.dir.dot(outNormal) > 0) {
      isFront = false;
      normal = outNormal.mulNum(-1);
    } else {
      normal = outNormal;
      isFront = true;
    }

    return new HitResult(true, new HitData(at, normal, t, material));
  }

  static miss() {
    return new HitResult(false, null);
  }
}

class Hittable {
  hit(ray, tMin, tMax) {
    throw Error("Not implemented error!");
  }
}

class HittableList {
  constructor() {
    this.objects = [];
  }

  add(obj) {
    this.objects.push(obj);
  }

  hit(ray, tMin, tMax) {
    let result = HitResult.miss();
    let closest = tMax;

    this.objects.forEach((obj) => {
      const objResult = obj.hit(ray, tMin, closest, obj);
      if (objResult.isHit) {
        result = objResult;
        closest = objResult.data.t;
      }
    });

    return result;
  }
}

class ScatterResult {
  constructor(ray, hitResult, attenuation, scattered) {
    this.ray = ray;
    this.hitResult = hitResult;
    this.attenuation = attenuation;
    this.scattered = scattered;
  }
}

class Material {
  scatter(ray, hitResult, attenuation, scattered) {
    throw Error();
  }
}

class Lambertian extends Material {
  scatter(ray, hitResult, attenuation, scattered) {}
}

class Sphere extends Hittable {
  constructor(center, radius, material) {
    super();
    this.center = center;
    this.radius = radius;
    this.material = material;
  }

  toString() {
    return `Sphere(${this.center}, ${this.radius}, ${this.material})`;
  }

  hit(ray, tMin, tMax) {
    const oc = ray.origin.sub(this.center);
    const a = ray.dir.dot(ray.dir);
    const b = oc.dot(ray.dir) * 2;
    const c = oc.dot(oc) - this.radius * this.radius;
    const discriminant = b * b - 4 * a * c;

    if (discriminant < 0) {
      return HitResult.miss();
    }

    let root = (-b - Math.sqrt(discriminant)) / (2 * a);
    if (root < tMin || root > tMax) {
      root = (-b + Math.sqrt(discriminant)) / (2 * a);
      if (root < tMin || root > tMax) {
        return false;
      }
    }

    const at = ray.at(root);
    const outNormal = at.sub(this.center).divNum(this.radius);
    return HitResult.hit(ray, at, outNormal, root, this.material);
  }
}

function rayColor(ray, world, depth) {
  if (depth <= 0) {
    return new Vec3(0, 0, 0);
  }

  const result = world.hit(ray, 0.0, Infinity);

  if (result.isHit) {
    const target = result.data.at
      .add(result.data.normal)
      .add(Vec3.randomInUnitSphere().unit());

    return rayColor(
      new Ray(result.data.at, target.sub(result.data.at)),
      world,
      depth - 1
    ).mulNum(0.5);
  }

  const unitDir = ray.dir.unit();
  const t = 0.5 * (unitDir.y + 1.0);
  return new Vec3(1, 1, 1).mulNum(1.0 - t).add(new Vec3(0.5, 0.6, 1).mulNum(t));
}

class Screen {
  constructor(width, height) {
    this.width = width;
    this.height = height;
    this.screen = [];
    for (let y = 0; y < this.width; y++) {
      for (let x = 0; x < this.height; x++) {
        this.screen.push(0); // r
        this.screen.push(0); // g
        this.screen.push(0); // b
        this.screen.push(255); // a
      }
    }
  }

  draw(x, y, color, sampleCount) {
    const divider = 1 / sampleCount;
    const r = Math.sqrt(color.x * divider);
    const g = Math.sqrt(color.y * divider);
    const b = Math.sqrt(color.z * divider);

    var index = (x + y * this.width) * 4;

    this.screen[index + 0] = 256 * clamp(r, 0, 0.999);
    this.screen[index + 1] = 256 * clamp(g, 0, 0.999);
    this.screen[index + 2] = 256 * clamp(b, 0, 0.999);
    this.screen[index + 3] = 255;
  }

  getData() {
    return this.screen;
  }
}

function render({
  width,
  height,
  viewportWidth,
  viewportHeight,
  cameraOrigin,
  focalLength,
  sampleCount,
  maxDepth,
}) {
  // Prepare context

  const lambertianMaterial = new Lambertian();

  const globalWorld = new HittableList();
  globalWorld.add(new Sphere(new Vec3(0, 0, -1), 0.5), lambertianMaterial);
  globalWorld.add(new Sphere(new Vec3(0, -100.5, -1), 100), lambertianMaterial);

  const origin = new Vec3(cameraOrigin[0], cameraOrigin[1], cameraOrigin[2]);

  const horizontal = new Vec3(viewportWidth, 0, 0);
  const vertical = new Vec3(0, viewportHeight, 0);

  const lowerLeftCorner = origin
    .sub(horizontal.divNum(2))
    .sub(vertical.divNum(2))
    .sub(new Vec3(0, 0, focalLength));

  // Do work

  console.log(
    width,
    height,
    viewportWidth,
    viewportHeight,
    origin,
    sampleCount,
    maxDepth
  );

  const screen = new Screen(width, height);

  for (let y = 0; y < height; y++) {
    if (y % 50 === 0) {
      sendResultScreen(screen);
    }

    for (let x = 0; x < width; x++) {
      let color = new Vec3(0, 0, 0);

      for (let i = 0; i < sampleCount; i++) {
        const u = (x + Math.random()) / (width - 1);
        const v = (y + Math.random()) / (height - 1);

        const r = new Ray(
          origin,
          lowerLeftCorner
            .add(horizontal.mulNum(u))
            .add(vertical.mulNum(v))
            .sub(origin)
        );

        color = color.add(rayColor(r, globalWorld, maxDepth));
      }

      screen.draw(x, height - y, color, sampleCount);
    }
  }

  sendResultScreen(screen);
}

function sendResultScreen(screen) {
  postMessage({ action: "result", result: screen.getData() });
}

onmessage = function (message) {
  if (message.data.action === "start") {
    console.log("start", message.data.options);

    render(message.data.options);
  }
};
