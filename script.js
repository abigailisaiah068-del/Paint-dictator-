// Color utilities
class ColorUtils {
    static hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;
    }

    static rgbToHex(r, g, b) {
        return "#" + [r, g, b].map(x => {
            const hex = x.toString(16);
            return hex.length === 1 ? "0" + hex : hex;
        }).join("").toUpperCase();
    }

    static rgbToHsl(r, g, b) {
        r /= 255;
        g /= 255;
        b /= 255;
        const max = Math.max(r, g, b), min = Math.min(r, g, b);
        let h, s, l = (max + min) / 2;

        if (max === min) {
            h = s = 0;
        } else {
            const d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
            switch (max) {
                case r: h = (g - b) / d + (g < b ? 6 : 0); break;
                case g: h = (b - r) / d + 2; break;
                case b: h = (r - g) / d + 4; break;
            }
            h /= 6;
        }

        return {
            h: Math.round(h * 360),
            s: Math.round(s * 100),
            l: Math.round(l * 100)
        };
    }

    static getColorName(hex) {
        const colorNames = {
            '#FF0000': 'Red',
            '#00FF00': 'Lime',
            '#0000FF': 'Blue',
            '#FFFF00': 'Yellow',
            '#FF00FF': 'Magenta',
            '#00FFFF': 'Cyan',
            '#FFFFFF': 'White',
            '#000000': 'Black',
            '#808080': 'Gray',
            '#FFA500': 'Orange',
            '#A52A2A': 'Brown',
            '#800080': 'Purple',
            '#FFC0CB': 'Pink',
            '#A9A9A9': 'Dark Gray',
            '#C0C0C0': 'Silver'
        };
        return colorNames[hex] || 'Custom Color';
    }

    static mixColors(hex1, hex2) {
        const rgb1 = this.hexToRgb(hex1);
        const rgb2 = this.hexToRgb(hex2);
        const mixed = {
            r: Math.round((rgb1.r + rgb2.r) / 2),
            g: Math.round((rgb1.g + rgb2.g) / 2),
            b: Math.round((rgb1.b + rgb2.b) / 2)
        };
        return this.rgbToHex(mixed.r, mixed.g, mixed.b);
    }

    static getColorHarmonies(hex) {
        const rgb = this.hexToRgb(hex);
        const hsl = this.rgbToHsl(rgb.r, rgb.g, rgb.b);

        // Complementary
        const complementary = (hsl.h + 180) % 360;
        
        // Triadic
        const triadic1 = (hsl.h + 120) % 360;
        const triadic2 = (hsl.h + 240) % 360;

        // Analogous
        const analogous1 = (hsl.h + 30) % 360;
        const analogous2 = (hsl.h - 30 + 360) % 360;

        return {
            base: hex,
            complementary: this.hslToHex(complementary, hsl.s, hsl.l),
            triadic: [
                hex,
                this.hslToHex(triadic1, hsl.s, hsl.l),
                this.hslToHex(triadic2, hsl.s, hsl.l)
            ],
            analogous: [
                this.hslToHex(analogous2, hsl.s, hsl.l),
                hex,
                this.hslToHex(analogous1, hsl.s, hsl.l)
            ]
        };
    }

    static hslToHex(h, s, l) {
        h = h % 360;
        s = s / 100;
        l = l / 100;

        const c = (1 - Math.abs(2 * l - 1)) * s;
        const x = c * (1 - Math.abs((h / 60) % 2 - 1));
        const m = l - c / 2;
        let r = 0, g = 0, b = 0;

        if (h >= 0 && h < 60) {
            r = c; g = x; b = 0;
        } else if (h >= 60 && h < 120) {
            r = x; g = c; b = 0;
        } else if (h >= 120 && h < 180) {
            r = 0; g = c; b = x;
        } else if (h >= 180 && h < 240) {
            r = 0; g = x; b = c;
        } else if (h >= 240 && h < 300) {
            r = x; g = 0; b = c;
        } else if (h >= 300 && h < 360) {
            r = c; g = 0; b = x;
        }

        return this.rgbToHex(
            Math.round((r + m) * 255),
            Math.round((g + m) * 255),
            Math.round((b + m) * 255)
        );
    }

    static isLight(hex) {
        const rgb = this.hexToRgb(hex);
        const luminance = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255;
        return luminance > 0.5;
    }
}

// Image color detection
class ImageColorDetector {
    static detectColors(imageSrc) {
        return new Promise((resolve) => {
            const img = new Image();
            img.crossOrigin = 'Anonymous';
            img.onload = () => {
                const canvas = document.getElementById('canvas');
                canvas.width = img.width;
                canvas.height = img.height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0);

                const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                const data = imageData.data;
                const colors = {};

                for (let i = 0; i < data.length; i += 4) {
                    const hex = ColorUtils.rgbToHex(data[i], data[i + 1], data[i + 2]);
                    colors[hex] = (colors[hex] || 0) + 1;
                }

                const sorted = Object.entries(colors)
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 10)
                    .map(([hex]) => hex);

                resolve(sorted);
            };
            img.src = imageSrc;
        });
    }
}

// UI Manager
class UIManager {
    static displayDetectedColors(colors) {
        const container = document.getElementById('detectionSection').querySelector('.colors-container');
        const palette = document.getElementById('detectedColors');
        palette.innerHTML = '';

        colors.forEach(color => {
            const item = document.createElement('div');
            item.className = 'color-item';
            item.innerHTML = `
                <div class="color-box-small" style="background: ${color};"></div>
                <div class="color-text">${color}</div>
            `;
            item.addEventListener('click', () => this.selectColor(color));
            palette.appendChild(item);
        });

        container.style.display = 'block';
    }

    static selectColor(hex) {
        document.getElementById('colorPicker').value = hex;
        document.getElementById('colorHex').value = hex;
        this.analyzeColor(hex);
    }

    static analyzeColor(hex) {
        const rgb = ColorUtils.hexToRgb(hex);
        const hsl = ColorUtils.rgbToHsl(rgb.r, rgb.g, rgb.b);
        const colorName = ColorUtils.getColorName(hex);

        // Update analysis section
        document.getElementById('selectedColorBox').style.background = hex;
        document.getElementById('hexValue').textContent = hex;
        document.getElementById('rgbValue').textContent = `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
        document.getElementById('hslValue').textContent = `hsl(${hsl.h}°, ${hsl.s}%, ${hsl.l}%)`;
        document.getElementById('colorName').textContent = colorName;

        document.getElementById('analysisSection').style.display = 'block';
        document.getElementById('mixerSection').style.display = 'block';
        document.getElementById('harmonySection').style.display = 'block';

        // Update mixer
        document.getElementById('color1Picker').value = hex;
        this.updateMixer();

        // Update harmonies
        this.displayHarmonies(hex);
    }

    static updateMixer() {
        const color1 = document.getElementById('color1Picker').value;
        const color2 = document.getElementById('color2Picker').value;
        const mixed = ColorUtils.mixColors(color1, color2);

        document.getElementById('color1Box').style.background = color1;
        document.getElementById('color2Box').style.background = color2;
        document.getElementById('resultBox').style.background = mixed;

        document.getElementById('color1Label').textContent = color1;
        document.getElementById('color2Label').textContent = color2;
        document.getElementById('resultLabel').textContent = mixed;
    }

    static displayHarmonies(hex) {
        const harmonies = ColorUtils.getColorHarmonies(hex);
        const container = document.getElementById('harmonies');
        container.innerHTML = `
            <div class="harmony">
                <h5>Complementary</h5>
                <div class="harmony-colors">
                    <div class="harmony-color" style="background: ${harmonies.base};"></div>
                    <div class="harmony-color" style="background: ${harmonies.complementary};"></div>
                </div>
            </div>
            <div class="harmony">
                <h5>Triadic</h5>
                <div class="harmony-colors">
                    ${harmonies.triadic.map(c => `<div class="harmony-color" style="background: ${c};"></div>`).join('')}
                </div>
            </div>
            <div class="harmony">
                <h5>Analogous</h5>
                <div class="harmony-colors">
                    ${harmonies.analogous.map(c => `<div class="harmony-color" style="background: ${c};"></div>`).join('')}
                </div>
            </div>
        `;
    }
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    // Image upload
    const imageInput = document.getElementById('imageInput');
    const preview = document.getElementById('preview');

    imageInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = async (event) => {
                preview.src = event.target.result;
                preview.style.display = 'block';
                const colors = await ImageColorDetector.detectColors(event.target.result);
                UIManager.displayDetectedColors(colors);
            };
            reader.readAsDataURL(file);
        }
    });

    // Drag and drop
    const uploadArea = document.querySelector('.upload-area');
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        uploadArea.addEventListener(eventName, preventDefaults, false);
    });

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    ['dragenter', 'dragover'].forEach(eventName => {
        uploadArea.addEventListener(eventName, () => {
            uploadArea.style.borderColor = '#764ba2';
        });
    });

    ['dragleave', 'drop'].forEach(eventName => {
        uploadArea.addEventListener(eventName, () => {
            uploadArea.style.borderColor = '#667eea';
        });
    });

    uploadArea.addEventListener('drop', (e) => {
        const dt = e.dataTransfer;
        const files = dt.files;
        imageInput.files = files;
        const event = new Event('change', { bubbles: true });
        imageInput.dispatchEvent(event);
    });

    // Color picker and hex input
    const colorPicker = document.getElementById('colorPicker');
    const colorHex = document.getElementById('colorHex');
    const analyzeBtn = document.getElementById('analyzeBtn');

    colorPicker.addEventListener('change', (e) => {
        colorHex.value = e.target.value;
    });

    colorHex.addEventListener('change', (e) => {
        const hex = e.target.value;
        if (/^#[0-9A-F]{6}$/i.test(hex)) {
            colorPicker.value = hex;
        }
    });

    analyzeBtn.addEventListener('click', () => {
        const hex = colorHex.value;
        if (/^#[0-9A-F]{6}$/i.test(hex)) {
            UIManager.analyzeColor(hex);
        }
    });

    // Mixer
    const color1Picker = document.getElementById('color1Picker');
    const color2Picker = document.getElementById('color2Picker');

    color1Picker.addEventListener('change', () => UIManager.updateMixer());
    color2Picker.addEventListener('change', () => UIManager.updateMixer());

    // Reverse button
    document.getElementById('reverseBtn').addEventListener('click', () => {
        const resultHex = document.getElementById('resultLabel').textContent;
        const reverseContainer = document.getElementById('reverseResultContainer');
        const reverseResults = document.getElementById('reverseResults');

        // Generate some color combinations that could produce this result
        const variations = [];
        for (let i = 0; i < 5; i++) {
            const randomHex = '#' + Math.floor(Math.random()*16777215).toString(16).padStart(6, '0').toUpperCase();
            const mixed = ColorUtils.mixColors(randomHex, resultHex);
            if (mixed === resultHex) {
                variations.push(randomHex);
            }
        }

        reverseResults.innerHTML = `
            <div class="reverse-item">
                <div class="reverse-color-box" style="background: ${resultHex};"></div>
                <div class="reverse-text">${resultHex}</div>
                <p style="margin-top: 10px; font-size: 0.9em;">Tip: This color can be created by mixing similar colors together</p>
            </div>
        `;

        reverseContainer.style.display = 'block';
    });

    // Reset mixer
    document.getElementById('resetMixerBtn').addEventListener('click', () => {
        document.getElementById('color1Picker').value = '#FF0000';
        document.getElementById('color2Picker').value = '#0000FF';
        UIManager.updateMixer();
        document.getElementById('reverseResultContainer').style.display = 'none';
    });

    // Initial state
    colorPicker.dispatchEvent(new Event('change'));
});
