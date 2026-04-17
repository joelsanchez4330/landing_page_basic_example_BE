import express, { Request, Response } from 'express';
import cors from 'cors';
import 'dotenv/config';

const app = express();
const PORT = process.env.PORT || 5000;

// 1. GLOBAL MIDDLEWARE
app.use(cors()); // Allows your Frontend to talk to this Backend
app.use(express.json()); // Parses JSON bodies

// 2. HEALTH CHECK (Formality)
// This is great for checking if your server is running without triggering a build
app.get('/', (req: Request, res: Response) => {
    res.json({
        status: 'online',
        message: 'Zenith Agency Assembler API is active.',
        version: '1.0.0'
    });
});

// 3. THE TRIGGER ENDPOINT (Simplified)
// We keep this here so your Frontend has a place to send the data.
app.post('/api/build', (req: Request, res: Response) => {
    const { clientName } = req.body;
    
    console.log(`Incoming build request for: ${clientName}`);

    // If you don't want to use a Webhook yet, you can just log it.
    // But usually, you'd trigger n8n here.
    res.status(202).json({
        message: 'Request received. Processing via n8n automation.',
        timestamp: new Date().toISOString()
    });
});

// 4. ERROR HANDLING
app.use((req: Request, res: Response) => {
    res.status(404).json({ error: 'Route not found' });
});

app.listen(PORT, () => {
    console.log(`🚀 Formal BE running on http://localhost:${PORT}`);
});