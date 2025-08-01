const express = require('express');
const cors = require('cors');
// REMOVEMOS o 'express-http-proxy'
const axios = require('axios');
const swaggerUi = require('swagger-ui-express');
const amqp = require('amqplib/callback_api');

const app = express();
const port = 8080;

app.use(cors());
app.use(express.json());

const REST_SERVICE_URL = 'http://localhost:3000';
const RABBITMQ_URL = 'amqp://localhost';
const QUEUE_NAME = 'habits_queue';

// --- Documentação Swagger (sem alteração) ---
const swaggerDocs = { /* ... cole o objeto swaggerDocs do seu arquivo atual aqui ... */ };
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));


// --- ROTAS DA API (AGORA TODAS MANUAIS) ---

// Rota de "Completar Hábito" (Produtor RabbitMQ)
app.post('/habits/:habitId/complete', async (req, res) => {
    const { userId } = req.body;
    const habitId = parseInt(req.params.habitId);
    try {
        const restResponse = await axios.post(`${REST_SERVICE_URL}/habits/${habitId}/complete`, { userId });
        if (restResponse.status === 200 && restResponse.data.pointsAwarded === true) {
            amqp.connect(RABBITMQ_URL, (err, connection) => {
                if (err) { console.error("[GATEWAY] Erro ao conectar no RabbitMQ", err); return; }
                connection.createChannel((err, channel) => {
                    if (err) { console.error("[GATEWAY] Erro ao criar canal", err); return; }
                    const msg = JSON.stringify({ userId, habitId, action: 'COMPLETED' });
                    channel.assertQueue(QUEUE_NAME, { durable: true });
                    channel.sendToQueue(QUEUE_NAME, Buffer.from(msg));
                    console.log(`[GATEWAY] Mensagem enviada para a fila: ${msg}`);
                    setTimeout(() => connection.close(), 500);
                });
            });
        }
        res.status(202).json(restResponse.data);
    } catch (error) {
        res.status(error.response?.status || 500).json(error.response?.data || { error: 'Erro interno no Gateway' });
    }
});

// --- ROTAS DE PROXY MANUAL (A CORREÇÃO ESTÁ AQUI) ---

// Rota para LISTAR hábitos (GET)
app.get('/users/:userId/habits', async (req, res) => {
    const userId = req.params.userId;
    try {
        console.log(`[GATEWAY] Encaminhando GET /users/${userId}/habits para o serviço REST...`);
        const restResponse = await axios.get(`${REST_SERVICE_URL}/users/${userId}/habits`);
        res.status(restResponse.status).json(restResponse.data);
    } catch (error) {
        res.status(error.response?.status || 500).json(error.response?.data || { error: 'Erro ao buscar hábitos' });
    }
});

// Rota para ADICIONAR hábito (POST)
app.post('/habits', async (req, res) => {
    try {
        console.log('[GATEWAY] Encaminhando POST /habits para o serviço REST...');
        const restResponse = await axios.post(`${REST_SERVICE_URL}/habits`, req.body);
        res.status(restResponse.status).json(restResponse.data);
    } catch (error) {
        res.status(error.response?.status || 500).json(error.response?.data || { error: 'Erro ao adicionar hábito' });
    }
});

// Rota para SIMULAR próximo dia (POST)
app.post('/simulate/next-day', async (req, res) => {
    try {
        console.log('[GATEWAY] Encaminhando POST /simulate/next-day para o serviço REST...');
        const restResponse = await axios.post(`${REST_SERVICE_URL}/simulate/next-day`);
        res.status(restResponse.status).json(restResponse.data);
    } catch (error) {
        res.status(error.response?.status || 500).json(error.response?.data || { error: 'Erro ao simular próximo dia' });
    }
});


// --- INICIAR SERVIDOR ---
app.listen(port, () => {
    console.log(`API Gateway (versão final com MOM) rodando em http://localhost:${port}`);
    console.log(`Documentação da API disponível em http://localhost:${port}/api-docs`);
});