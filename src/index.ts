import express, { Request, Response } from 'express';
import cors from 'cors';
import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { simpleGit, SimpleGit } from 'simple-git';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// --- CONFIGURATION ---
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const REPO_OWNER = 'joelsanchez4330';
const REPO_NAME = 'landing_page_basic_example_BE';
const REPO_URL = `https://${GITHUB_TOKEN}@github.com/${REPO_OWNER}/${REPO_NAME}.git`;
const TEMP_REPO_PATH = path.join(process.cwd(), 'temp_build');

const git: SimpleGit = simpleGit();

app.post('/generate-site', async (req: Request, res: Response): Promise<any> => {
    const { clientName, selectedComponents, siteConfig } = req.body;

    if (!clientName || !selectedComponents || !siteConfig) {
        return res.status(400).json({ error: 'Missing required data: clientName, selectedComponents, or siteConfig' });
    }

    try {
        // 1. Clean up old temp folder if it exists
        if (fs.existsSync(TEMP_REPO_PATH)) {
            fs.rmSync(TEMP_REPO_PATH, { recursive: true, force: true });
        }

        // 2. Clone the core template
        console.log(`Cloning template for ${clientName}...`);
        await git.clone(REPO_URL, TEMP_REPO_PATH);
        const clientGit: SimpleGit = simpleGit(TEMP_REPO_PATH);

        // 3. Create a new branch for the client
        const branchName = `deploy/${clientName.toLowerCase().replace(/\s+/g, '-')}`;
        await clientGit.checkoutLocalBranch(branchName);

        // 4. Update site-config.json
        const configPath = path.join(TEMP_REPO_PATH, 'src/data/site-config.json');
        fs.writeFileSync(configPath, JSON.stringify(siteConfig, null, 2));

        // 5. Update App.tsx (The "Assembly")
        const appPath = path.join(TEMP_REPO_PATH, 'src/App.tsx');
        let appContent = fs.readFileSync(appPath, 'utf8');

        // Use the markers you actually wrote in App.tsx
        // Replace Import Marker
        appContent = appContent.replace(
            /\/\/ --- AUTO_IMPORT_MARKER ---/g, 
            `// --- AUTO_IMPORT_MARKER ---\nimport Hero from './components/Hero/${selectedComponents.hero}';\nimport Feature from './components/Features/${selectedComponents.feature}';\nimport Gallery from './components/Gallery/${selectedComponents.gallery}';`
        );

        // Replace Component Slots
        appContent = appContent.replace(/\{(\/\* --- SLOT_HERO --- \*\/)\}/g, `<Hero config={configData} />`);
        appContent = appContent.replace(/\{(\/\* --- SLOT_FEATURE --- \*\/)\}/g, `<Feature config={configData} />`);
        appContent = appContent.replace(/\{(\/\* --- SLOT_GALLERY --- \*\/)\}/g, `<Gallery config={configData} />`);

        fs.writeFileSync(appPath, appContent);

        // 6. Push to GitHub
        await clientGit.add('.');
        await clientGit.commit(`Build for ${clientName}`);
        await clientGit.push('origin', branchName);

        res.json({ 
            success: true, 
            message: `Site generated on branch ${branchName}`,
            branch: branchName 
        });

    } catch (error: any) {
        console.error('Build Error:', error);
        res.status(500).json({ error: 'Failed to generate site', details: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 Agency Assembler running on http://localhost:${PORT}`);
});