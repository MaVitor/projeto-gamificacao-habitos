const soap = require('soap');

// URL do WSDL do nosso serviço Python.
const wsdlUrl = 'http://localhost:7789/?wsdl';

// IDs dos usuários que queremos incluir no ranking.
const userIds = ['user-1', 'user-2'];

async function generateLeaderboard() {
    console.log('Gerando ranking de usuários...');

    try {
        // 1. Cria o cliente SOAP a partir do WSDL.
        const client = await soap.createClientAsync(wsdlUrl);

        // 2. Busca os perfis de todos os usuários em paralelo.
        const profilePromises = userIds.map(userId => {
            console.log(`Buscando perfil para ${userId}...`);
            return client.getUserProfileAsync({ userId: userId });
        });

        const results = await Promise.all(profilePromises);

        // 3. Processa os resultados - ESTA É A LINHA CORRIGIDA
        // Acessamos o primeiro item do array (result[0]) e depois a chave 'getUserProfileResult'.
        const userProfiles = results.map(result => result[0].getUserProfileResult);

        // 4. Ordena os usuários pela pontuação.
        userProfiles.sort((a, b) => b.points - a.points);
        
        // 5. Exibe o ranking final e formatado.
        console.log('\n--- Ranking de Hábitos ---');
        userProfiles.forEach((profile, index) => {
            // Adicionamos uma verificação para o caso de um perfil não ser encontrado
            if (profile && profile.userId && profile.points !== undefined) {
                console.log(`${index + 1}. ${profile.userId} - ${profile.points} Pontos`);
            }
        });
        console.log('--------------------------\n');

    } catch (error) {
        console.error('Falha ao gerar o ranking. O serviço SOAP está rodando?');
        console.error('Erro:', error.message);
    }
}

// Executa a função principal
generateLeaderboard();