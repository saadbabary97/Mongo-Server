import express from 'express';
import { connectToDatabase } from './config/database';
import { setExampleRoutes } from './routes/exampleRoute';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

connectToDatabase()
    .then(() => {
        setExampleRoutes(app);
        app.listen(PORT, () => {
            console.log(`Server is running on http://localhost:${PORT}`);
        });
    })
    .catch(err => {
        console.error('Database connection error:', err);
    });