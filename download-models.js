import fs from 'fs';
import https from 'https';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const modelsDir = path.join(__dirname, 'public', 'models');

// Create models directory if it doesn't exist
if (!fs.existsSync(modelsDir)) {
    fs.mkdirSync(modelsDir, { recursive: true });
}

const modelFiles = [
    'face_recognition_model-shard1',
    'face_recognition_model-shard2',
    'face_recognition_model-weights_manifest.json',
    'face_expression_model-shard1',
    'face_expression_model-weights_manifest.json',
    'ssd_mobilenetv1_model-shard1',
    'ssd_mobilenetv1_model-shard2',
    'ssd_mobilenetv1_model-weights_manifest.json'
];

const baseUrl = 'https://justadudewhohacks.github.io/face-api.js/models';

async function downloadFile(filename) {
    const destination = path.join(modelsDir, filename);
    const fileUrl = `${baseUrl}/${filename}`;

    return new Promise((resolve, reject) => {
        https.get(fileUrl, (response) => {
            if (response.statusCode !== 200) {
                reject(new Error(`Failed to download ${filename}: ${response.statusCode}`));
                return;
            }

            const fileStream = fs.createWriteStream(destination);
            response.pipe(fileStream);

            fileStream.on('finish', () => {
                fileStream.close();
                console.log(`Downloaded ${filename}`);
                resolve();
            });
        }).on('error', (err) => {
            reject(err);
        });
    });
}

async function downloadAllModels() {
    console.log('Downloading face-api.js models...');
    for (const file of modelFiles) {
        try {
            await downloadFile(file);
        } catch (error) {
            console.error(`Error downloading ${file}:`, error.message);
        }
    }
    console.log('All models downloaded!');
}

downloadAllModels();
