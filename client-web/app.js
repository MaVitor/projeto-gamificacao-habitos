const API_URL = 'http://localhost:8080';
const availableUsers = ['user-1', 'user-2']; 

// Elementos da página
const habitsList = document.getElementById('habits-list');
const userSelect = document.getElementById('user-select');
const newHabitForm = document.getElementById('new-habit-form');
const newHabitTitleInput = document.getElementById('new-habit-title');
const nextDayBtn = document.getElementById('next-day-btn');
const helpIcon = document.getElementById('help-icon'); // Pega o novo ícone

// --- Funções de API ---
async function completeHabit(habitId) { /* ...código sem alteração... */
    const currentUserId = userSelect.value;
    try {
        const response = await fetch(`${API_URL}/habits/${habitId}/complete`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: currentUserId }),
        });
        if (!response.ok) throw new Error('Falha ao completar o hábito');
        fetchHabits();
    } catch (error) {
        console.error('Erro:', error);
        alert('Não foi possível completar o hábito.');
    }
}
async function addNewHabit(event) { /* ...código sem alteração... */
    event.preventDefault();
    const title = newHabitTitleInput.value.trim();
    const currentUserId = userSelect.value;
    if (!title) return;
    try {
        const response = await fetch(`${API_URL}/habits`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: currentUserId, title: title }),
        });
        if (!response.ok) throw new Error('Falha ao adicionar hábito.');
        newHabitTitleInput.value = '';
        fetchHabits();
    } catch (error) {
        console.error('Erro:', error);
        alert('Não foi possível adicionar o hábito.');
    }
}
async function simulateNextDay() { /* ...código sem alteração... */
    try {
        const response = await fetch(`${API_URL}/simulate/next-day`, { method: 'POST' });
        if (!response.ok) throw new Error('Falha ao simular o próximo dia.');
        fetchHabits();
    } catch (error) {
        console.error('Erro na simulação:', error);
        alert('Não foi possível simular o próximo dia.');
    }
}

// --- Funções de Renderização e Lógica ---
function renderHabits(habits) { /* ...código sem alteração... */
    habitsList.innerHTML = ''; 
    if (habits.length === 0) {
        habitsList.innerHTML = '<p>Nenhum hábito encontrado para este usuário.</p>';
        return;
    }
    habits.forEach(habit => {
        const habitDiv = document.createElement('div');
        habitDiv.className = 'habit-item';
        if (habit.completed) habitDiv.classList.add('completed');
        const habitTitle = document.createElement('p');
        habitTitle.textContent = `${habit.title} (Sequência: ${habit.streak})`;
        const completeButton = document.createElement('button');
        completeButton.textContent = 'Completar';
        if (habit.completed) {
            completeButton.disabled = true;
        } else {
            completeButton.onclick = () => completeHabit(habit.id);
        }
        habitDiv.appendChild(habitTitle);
        habitDiv.appendChild(completeButton);
        habitsList.appendChild(habitDiv);
    });
}
async function fetchHabits() { /* ...código sem alteração... */
    const currentUserId = userSelect.value;
    try {
        const response = await fetch(`${API_URL}/users/${currentUserId}/habits`);
        if (!response.ok) throw new Error('Não foi possível buscar os dados.');
        const habits = await response.json();
        renderHabits(habits);
    } catch (error) {
        console.error('Erro:', error);
        habitsList.innerHTML = '<p>Erro ao carregar os hábitos.</p>';
    }
}
function populateUserSelector() { /* ...código sem alteração... */
    availableUsers.forEach(user => {
        const option = document.createElement('option');
        option.value = user;
        option.textContent = user;
        userSelect.appendChild(option);
    });
}

// --- Inicialização ---

function init() {
    populateUserSelector();
    userSelect.addEventListener('change', fetchHabits);
    newHabitForm.addEventListener('submit', addNewHabit);
    nextDayBtn.addEventListener('click', simulateNextDay);
    
    // MUDANÇA: Adiciona o listener de clique para o ícone de ajuda
    helpIcon.addEventListener('click', () => {
        const explanationText = `--- Como Funciona o Sistema ---\n\n` +
            `1. PONTUAÇÃO:\n` +
            `Cada vez que você completa um hábito (que ainda não foi feito no 'dia'), você ganha 10 pontos!\n\n` +
            `2. SEQUÊNCIA (STREAK):\n` +
            `Este número mostra há quantos 'dias' seguidos você completa um hábito. É uma medida da sua consistência.\n\n` +
            `3. SIMULAR PRÓXIMO DIA:\n` +
            `Ao clicar neste botão, o sistema avança para o 'dia' seguinte:\n` +
            `   - Hábitos que você NÃO completou terão sua sequência ZERADA.\n` +
            `   - Todos os hábitos ficam disponíveis para serem completados novamente.\n\n` +
            `Não quebre a corrente!`;
        
        alert(explanationText);
    });
    
    fetchHabits();
}

init();