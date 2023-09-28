function hslToRgb(h: number, s: number, l: number): [number, number, number] {
    const hue2rgb = (p: number, q: number, t: number) => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1 / 6) return p + (q - p) * 6 * t;
        if (t < 1 / 2) return q;
        if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
        return p;
    };

    s = s / 100;
    l = l / 100;
    let r: number, g: number, b: number;

    if (s === 0) {
        r = l;
        g = l;
        b = l; // Achromatic
    } else {
        const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        const p = 2 * l - q;
        r = hue2rgb(p, q, h + 1 / 3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1 / 3);
    }

    return [r, g, b];
}

function generateBrightMutedColor(): [number, number, number] {
    // Random hue between 0 and 1
    const hue = Math.random();

    // Random saturation between 40% and 60%
    const saturation = Math.floor(Math.random() * (61 - 40) + 40);

    // Random lightness between 50% and 70%
    const lightness = Math.floor(Math.random() * (71 - 50) + 50);

    return hslToRgb(hue, saturation, lightness);
}

export default generateBrightMutedColor;