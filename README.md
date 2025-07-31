# Plataforma de Gamificação de Hábitos

![Node.js](https://img.shields.io/badge/Node.js-20.x-339933?style=for-the-badge&logo=node.js&logoColor=white)
![Python](https://img.shields.io/badge/Python-3.12-3776AB?style=for-the-badge&logo=python&logoColor=white)
![SOAP](https://img.shields.io/badge/SOAP-XML-orange?style=for-the-badge)
![REST](https://img.shields.io/badge/REST-JSON-blue?style=for-the-badge)

Projeto acadêmico que demonstra a implementação de uma arquitetura de microsserviços integrando as tecnologias REST e SOAP através de um API Gateway. A aplicação simula um sistema de gamificação onde usuários podem gerenciar hábitos, permitindo a criação de novos hábitos e a simulação de uma rotina diária para teste da lógica de pontuação e sequências (streaks).

---

## Funcionalidades

* **Visualização de Hábitos:** A interface exibe a lista de hábitos do usuário selecionado.
* **Criação Dinâmica de Hábitos:** É possível adicionar novos hábitos diretamente pela interface.
* **Marcar Hábitos como Completos:** Usuários podem marcar um hábito como concluído para o "dia" atual.
* **Gamificação (Pontos e Sequências):**
    * Ao completar um hábito, o usuário ganha pontos (via serviço SOAP).
    * A "Sequência" (streak) de dias consecutivos que um hábito é completado é rastreada e exibida.
* **Simulação de Passagem de Dia:** Um botão permite simular a passagem para o dia seguinte, resetando o status dos hábitos e as sequências daqueles que não foram completados.
* **Troca de Usuário:** A interface permite alternar a visualização entre diferentes usuários cadastrados no sistema.

---

## Arquitetura

O sistema é composto por 4 serviços principais e 2 clientes, seguindo o padrão de API Gateway para centralizar o acesso e orquestrar a comunicação.

```
[Cliente Web (Browser)] ---+
                           |
                           V
+---------------------------------------+
|         API Gateway (Node.js)         |  (Porta 8080)
| (Ponto de Entrada Único / Orquestrador) |
+---------------------------------------+
                  |      |
                  |      +------------------> [ Serviço SOAP (Python) - Recompensas ] (Porta 7789)
                  |
                  +------------------------> [ Serviço REST (Node.js) - Hábitos ] (Porta 3000)


[Cliente Admin (Terminal)] ---------------> [ Serviço SOAP (Python) - Recompensas ] (Acesso Direto)
```
---

## Tecnologias Utilizadas

* **API Gateway (Node.js):** `Express.js`, `axios`
* **Serviço REST (Node.js):** `Express.js`
* **Serviço SOAP (Python):** `Spyne`, `Werkzeug`
* **Cliente Web:** HTML, CSS, JavaScript (puro)
* **Cliente Admin SOAP (Node.js):** `soap`

---

## Como Executar o Projeto

Siga os passos abaixo para configurar e rodar a aplicação completa.

### Pré-requisitos

* [Node.js](https://nodejs.org/) (versão 18 ou superior)
* [Python](https://www.python.org/) (versão 3.12 ou superior)
* [Git](https://git-scm.com/)

### Instalação

1.  **Clone o repositório:**
    ```bash
    git clone [https://github.com/SEU-USUARIO/projeto-gamificacao-habitos.git](https://github.com/SEU-USUARIO/projeto-gamificacao-habitos.git)
    cd projeto-gamificacao-habitos
    ```

2.  **Configure o Serviço SOAP (Python):**
    ```bash
    cd service-soap-rewards
    python -m venv venv
    # No Windows: .\venv\Scripts\activate
    # No macOS/Linux: source venv/bin/activate
    pip install werkzeug lxml
    ```
    > **Atenção: Correção para Python 3.12+**
    > Para resolver a incompatibilidade da versão do Spyne com o Python 3.12, instale a versão de desenvolvimento diretamente do GitHub:
    > ```bash
    > pip install git+[https://github.com/arskom/spyne.git@master](https://github.com/arskom/spyne.git@master)
    > ```
    ```bash
    cd ..
    ```

3.  **Configure o Serviço REST (Node.js):**
    ```bash
    cd service-rest-habits
    npm install
    cd ..
    ```

4.  **Configure o API Gateway (Node.js):**
    ```bash
    cd gateway
    npm install
    cd ..
    ```

5.  **Configure o Cliente Admin SOAP (Node.js):**
    ```bash
    cd client-soap-admin
    npm install
    cd ..
    ```

### Execução

Para rodar a aplicação, você precisará de **3 terminais** abertos para os serviços de backend.

1.  **Terminal 1: Iniciar Serviço SOAP**
    ```bash
    cd service-soap-rewards
    # Ative o venv se não estiver ativo
    python app.py
    ```

2.  **Terminal 2: Iniciar Serviço REST**
    ```bash
    cd service-rest-habits
    node app.js
    ```

3.  **Terminal 3: Iniciar API Gateway**
    ```bash
    cd gateway
    node app.js
    ```

4.  **Acessar o Cliente Web:**
    * Abra a pasta `client-web` no seu editor de código (VS Code).
    * Clique com o botão direito no arquivo `index.html` e selecione "Open with Live Server".
    * *Alternativa:* Em um 4º terminal, navegue até `client-web` e rode `python -m http.server`. Acesse `http://localhost:8000` no navegador.

5.  **Executar o Cliente Admin:**
    * Em um 4º terminal, navegue até `client-soap-admin`.
    * Execute `node leaderboard.js` para ver o ranking no console.

---

## Documentação da API

O ponto de entrada para todos os clientes é o **API Gateway** na porta `http://localhost:8080`.

### Endpoints REST

* `GET /users/:userId/habits`
    * Retorna a lista de hábitos de um usuário específico.

* `POST /habits`
    * Cria um novo hábito para um usuário.
    * **Corpo (Body):** `{ "userId": "string", "title": "string" }`

* `POST /habits/:habitId/complete`
    * Marca um hábito como completo e, através de orquestração no Gateway, credita pontos via serviço SOAP.
    * **Corpo (Body):** `{ "userId": "string" }`

* `POST /simulate/next-day`
    * Aciona a lógica de simulação do próximo dia no serviço REST, resetando os hábitos e as sequências, se necessário.

### Operações SOAP

O serviço SOAP (`http://localhost:7789/?wsdl`) expõe as seguintes operações:

* `getUserProfile(userId)`
    * Retorna os dados de gamificação de um usuário (pontos, medalhas).
* `creditPoints(userId, points)`
    * Adiciona uma quantidade de pontos à conta de um usuário.