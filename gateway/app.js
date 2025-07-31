const express = require('express');
const cors = require('cors');
const proxy = require('express-http-proxy');
const axios = require('axios');

const app = express();
const port = 8080;

app.use(cors());
app.use(express.json());

const REST_SERVICE_URL = 'http://localhost:3000';
const SOAP_SERVICE_URL = 'http://localhost:7789';

// --- ROTAS QUE O GATEWAY TRATA DIRETAMENTE ---

// 1. Rota Raiz (HATEOAS)
app.get('/', (req, res) => {
    res.json({
        message: "Bem-vindo à API de Gamificação de Hábitos!",
        _links: {
            self: { href: `http://localhost:${port}/` },
            habits_user1: { href: `http://localhost:${port}/users/user-1/habits` }
        }
    });
});

// 2. Rota de Orquestração (lógica complexa)
app.post('/habits/:habitId/complete', async (req, res) => {
    const { userId } = req.body;
    const habitId = req.params.habitId;
    try {
        const restResponse = await axios.post(`${REST_SERVICE_URL}/habits/${habitId}/complete`, { userId });
        if (restResponse.status === 200 && restResponse.data.pointsAwarded === true) {
            console.log('[Gateway] Hábito completado. Chamando serviço SOAP para creditar pontos.');
            const pointsToCredit = 10;
            const soapEnvelope = `
                <soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:tns="br.com.empresa.gamificacao.rewards">
                   <soapenv:Header/>
                   <soapenv:Body>
                      <tns:creditPoints>
                         <tns:userId>${userId}</tns:userId>
                         <tns:points>${pointsToCredit}</tns:points>
                      </tns:creditPoints>
                   </soapenv:Body>
                </soapenv:Envelope>
            `;
            await axios.post(SOAP_SERVICE_URL, soapEnvelope, { headers: { 'Content-Type': 'text/xml', 'SOAPAction': 'creditPoints' } });
            console.log(`[Gateway] Pontos creditados para ${userId} via SOAP.`);
        } else {
            console.log('[Gateway] Hábito já estava completo ou não encontrado. Pontos não foram creditados.');
        }
        res.status(restResponse.status).json(restResponse.data);
    } catch (error) {
        console.error('[Gateway] Erro na orquestração:', error.message);
        res.status(error.response?.status || 500).json(error.response?.data || { error: 'Erro interno no Gateway' });
    }
});

// 3. Rota de Proxy Manual para Simulação
app.post('/simulate/next-day', async (req, res) => {
    try {
        console.log('[Gateway] Recebido POST em /simulate/next-day. Encaminhando manualmente...');
        const restResponse = await axios.post(`${REST_SERVICE_URL}/simulate/next-day`);
        res.status(restResponse.status).json(restResponse.data);
    } catch (error) {
        console.error('[Gateway] Erro no encaminhamento de /simulate/next-day:', error.message);
        res.status(error.response?.status || 500).json(error.response?.data || { error: 'Erro interno no Gateway' });
    }
});

// 4. ROTA DE PROXY MANUAL PARA ADICIONAR HÁBITO (NOVA CORREÇÃO)
app.post('/habits', async (req, res) => {
    try {
        console.log('[Gateway] Recebido POST em /habits. Encaminhando manualmente...');
        // É crucial encaminhar o corpo (body) da requisição original.
        const restResponse = await axios.post(`${REST_SERVICE_URL}/habits`, req.body);
        res.status(restResponse.status).json(restResponse.data);
    } catch (error) {
        console.error('[Gateway] Erro no encaminhamento de /habits:', error.message);
        res.status(error.response?.status || 500).json(error.response?.data || { error: 'Erro interno no Gateway' });
    }
});


// --- PROXY "PEGA-TUDO" (VEM POR ÚLTIMO) ---
// Para todo o resto (ex: GET /users/:userId/habits).
app.use('/', proxy(REST_SERVICE_URL));


// --- Iniciar o Servidor ---
app.listen(port, () => {
    console.log(`API Gateway (versão final e robusta) rodando em http://localhost:${port}`);
});