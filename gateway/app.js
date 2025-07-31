const express = require('express');
const cors = require('cors');
const proxy = require('express-http-proxy');
const axios = require('axios');
const swaggerUi = require('swagger-ui-express');
// REMOVEMOS o swagger-jsdoc

const app = express();
const port = 8080;

app.use(cors());
app.use(express.json());

const REST_SERVICE_URL = 'http://localhost:3000';
const SOAP_SERVICE_URL = 'http://localhost:7789';

// --- CONFIGURAÇÃO DO SWAGGER (MÉTODO NOVO E ROBUSTO) ---
const swaggerDocs = {
    openapi: '3.0.0',
    info: {
        title: 'API de Gamificação de Hábitos',
        version: '1.0.0',
        description: 'API Gateway que integra um serviço REST de hábitos e um serviço SOAP de recompensas.'
    },
    servers: [{ url: `http://localhost:${port}` }],
    tags: [
        { name: 'Hábitos', description: 'API para gerenciamento de hábitos' },
        { name: 'Simulação', description: 'Endpoints para controlar a simulação do sistema' }
    ],
    paths: {
        '/users/{userId}/habits': {
            get: {
                summary: 'Lista os hábitos de um usuário',
                tags: ['Hábitos'],
                parameters: [{
                    in: 'path',
                    name: 'userId',
                    required: true,
                    description: 'O ID do usuário (ex: user-1).',
                    schema: { type: 'string' }
                }],
                responses: { '200': { description: 'Sucesso. Retorna uma lista de hábitos.' } }
            }
        },
        '/habits': {
            post: {
                summary: 'Cria um novo hábito',
                tags: ['Hábitos'],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: { userId: { type: 'string' }, title: { type: 'string' } }
                            }
                        }
                    }
                },
                responses: { '201': { description: 'Hábito criado com sucesso.' } }
            }
        },
        '/habits/{habitId}/complete': {
            post: {
                summary: 'Marca um hábito como completo',
                tags: ['Hábitos'],
                parameters: [{
                    in: 'path',
                    name: 'habitId',
                    required: true,
                    description: 'O ID do hábito.',
                    schema: { type: 'integer' }
                }],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: { userId: { type: 'string' } }
                            }
                        }
                    }
                },
                responses: { '200': { description: 'Hábito completado.' } }
            }
        },
        '/simulate/next-day': {
            post: {
                summary: 'Simula a passagem para o próximo dia',
                tags: ['Simulação'],
                description: "Reseta o status 'completed' de todos os hábitos e zera a sequência (streak) daqueles que não foram completados.",
                responses: { '200': { description: 'Simulação concluída com sucesso.' } }
            }
        }
    }
};

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));


// --- ROTAS DA API ---
app.get('/', (req, res) => { res.json({ message: "Bem-vindo à API de Gamificação de Hábitos!" }); });
app.post('/habits/:habitId/complete', async (req, res) => {
    const { userId } = req.body;
    const habitId = req.params.habitId;
    try {
        const restResponse = await axios.post(`${REST_SERVICE_URL}/habits/${habitId}/complete`, { userId });
        if (restResponse.status === 200 && restResponse.data.pointsAwarded === true) {
            const pointsToCredit = 10;
            const soapEnvelope = `<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:tns="br.com.empresa.gamificacao.rewards"><soapenv:Header/><soapenv:Body><tns:creditPoints><tns:userId>${userId}</tns:userId><tns:points>${pointsToCredit}</tns:points></tns:creditPoints></soapenv:Body></soapenv:Envelope>`;
            await axios.post(SOAP_SERVICE_URL, soapEnvelope, { headers: { 'Content-Type': 'text/xml', 'SOAPAction': 'creditPoints' } });
        }
        res.status(restResponse.status).json(restResponse.data);
    } catch (error) {
        res.status(error.response?.status || 500).json(error.response?.data || { error: 'Erro interno no Gateway' });
    }
});
app.post('/simulate/next-day', async (req, res) => {
    try {
        const restResponse = await axios.post(`${REST_SERVICE_URL}/simulate/next-day`);
        res.status(restResponse.status).json(restResponse.data);
    } catch (error) {
        res.status(error.response?.status || 500).json(error.response?.data || { error: 'Erro interno no Gateway' });
    }
});
app.post('/habits', async (req, res) => {
    try {
        const restResponse = await axios.post(`${REST_SERVICE_URL}/habits`, req.body);
        res.status(restResponse.status).json(restResponse.data);
    } catch (error) {
        res.status(error.response?.status || 500).json(error.response?.data || { error: 'Erro interno no Gateway' });
    }
});
app.use('/', proxy(REST_SERVICE_URL));

// --- INICIAR SERVIDOR ---
app.listen(port, () => {
    console.log(`API Gateway (versão final) rodando em http://localhost:${port}`);
    console.log(`Documentação da API disponível em http://localhost:${port}/api-docs`);
});