const express = require('express');
const cors = require('cors');

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

// --- Banco de Dados em Memória ---
let userHabits = {
    "user-1": [
        { id: 1, title: "Ler 10 páginas de um livro", completed: false, streak: 5 },
        { id: 2, title: "Beber 2 litros de água", completed: false, streak: 3 },
        { id: 3, title: "Fazer 15 minutos de exercício", completed: false, streak: 10 },
    ],
    "user-2": [
        { id: 4, title: "Meditar por 5 minutos", completed: false, streak: 20 },
    ]
};
let nextHabitId = 5;


// --- ROTAS DA API ---

// [GET] para listar os hábitos de um usuário
app.get('/users/:userId/habits', (req, res) => {
    const userId = req.params.userId;
    console.log(`[SERVIÇO REST] Rota GET /users/${userId}/habits chamada.`);
    res.json(userHabits[userId] || []);
});

// [POST] para criar um novo hábito
app.post('/habits', (req, res) => {
    const { userId, title } = req.body;
    console.log(`[SERVIÇO REST] Rota POST /habits chamada com o título: ${title}`);
    if (!userId || !title) return res.status(400).json({ error: 'userId e title são obrigatórios' });
    
    const newHabit = { id: nextHabitId++, title, completed: false, streak: 0 };
    if (!userHabits[userId]) userHabits[userId] = [];
    userHabits[userId].push(newHabit);
    
    res.status(201).json(newHabit);
});

// [POST] para completar um hábito
app.post('/habits/:habitId/complete', (req, res) => {
    const { userId } = req.body;
    const habitId = parseInt(req.params.habitId);
    console.log(`[SERVIÇO REST] Rota POST /habits/${habitId}/complete chamada.`);
    
    const habits = userHabits[userId];
    const habit = habits ? habits.find(h => h.id === habitId) : null;
    
    if (habit) {
        if (!habit.completed) {
            habit.completed = true;
            habit.streak++;
            res.json({ message: 'Hábito completado com sucesso!', habit, pointsAwarded: true });
        } else {
            res.json({ message: 'Hábito já estava completo.', habit, pointsAwarded: false });
        }
    } else {
        res.status(404).json({ error: 'Hábito não encontrado' });
    }
});

// [POST] para simular o próximo dia
app.post('/simulate/next-day', (req, res) => {
    console.log('[SERVIÇO REST] Rota POST /simulate/next-day chamada.');

    for (const userId in userHabits) {
        userHabits[userId].forEach(habit => {
            if (!habit.completed) {
                habit.streak = 0;
            }
            habit.completed = false;
        });
    }
    
    console.log('[SERVIÇO REST] Status dos hábitos resetados para o novo dia.');
    res.status(200).json({ message: 'Simulação do próximo dia concluída.' });
});


// --- Iniciar o Servidor ---
app.listen(port, () => {
    console.log(`Serviço REST (VERSÃO COMPLETA E FINAL) rodando em http://localhost:${port}`);
});