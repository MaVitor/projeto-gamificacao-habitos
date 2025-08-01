# Plataforma de Gamificação de Hábitos (Arquitetura Assíncrona)

![Node.js](https://img.shields.io/badge/Node.js-20.x-339933?style=for-the-badge&logo=node.js&logoColor=white)
![Python](https://img.shields.io/badge/Python-3.12-3776AB?style=for-the-badge&logo=python&logoColor=white)
![RabbitMQ](https://img.shields.io/badge/RabbitMQ-Message_Broker-FF6600?style=for-the-badge&logo=rabbitmq&logoColor=white)

Projeto acadêmico que demonstra a implementação de uma arquitetura de microsserviços **assíncrona e orientada a eventos**. O sistema integra tecnologias como REST, SOAP e um Message Broker (RabbitMQ) através de um API Gateway.

---

## Funcionalidades

* **Comunicação Assíncrona:** A conclusão de hábitos dispara um evento para uma fila de mensagens, tornando a resposta ao usuário instantânea.
* **Produtores e Consumidores:** O API Gateway atua como **Produtor** de eventos, enquanto serviços independentes em Python atuam como **Consumidores** que processam as tarefas em segundo plano.
* **Gamificação (Pontos e Sequências):**
    * Ao completar um hábito, um evento é processado para creditar pontos ao usuário (via serviço SOAP).
    * O sistema rastreia e exibe a "Sequência" (streak) de hábitos completados.
* **Interface Interativa:** Permite adicionar hábitos, alternar entre usuários e simular a passagem de dias para testar a lógica de reset de sequências.

---

## Arquitetura Assíncrona com Fila de Mensagens

A arquitetura foi evoluída para um modelo orientado a eventos. O API Gateway publica mensagens em uma fila do RabbitMQ, e os serviços consumidores reagem a essas mensagens de forma independente.

```
                                        +-------------------------------------+
                                   +--->|  Consumidor SOAP (Python)           |---> [Serviço SOAP de Recompensas]
                                   |    +-------------------------------------+   (Credita os Pontos)
[Cliente Web] -> [API Gateway (Produtor)] -> [  RabbitMQ (Fila de Mensagens) ]
                                   |
                                   |    (Outros consumidores poderiam ser adicionados aqui)
                                   |
                                   +---> [Serviço REST de Hábitos] (Chamada síncrona para resposta rápida na UI)
```
---

## Tecnologias Utilizadas

* **Message Broker:** `RabbitMQ`
* **API Gateway (Node.js):** `Express.js`, `amqplib` (Produtor RabbitMQ)
* **Serviço REST (Node.js):** `Express.js`
* **Serviço SOAP (Python):** `Spyne`, `Werkzeug`
* **Consumidor SOAP (Python):** `pika` (Consumidor RabbitMQ), `zeep` (Cliente SOAP)
* **Cliente Web:** HTML, CSS, JavaScript (puro)
* **Cliente Admin SOAP (Node.js):** `soap`

---

## Como Executar o Projeto

### Pré-requisitos

* [Node.js](https://nodejs.org/) (versão 18 ou superior)
* [Python](https://www.python.org/) (versão 3.12 ou superior)
* [Docker](https://www.docker.com/products/docker-desktop/) (para rodar o RabbitMQ)
* [Git](https://git-scm.com/)

### Instalação

As instruções de instalação para cada serviço estão detalhadas no `README.md` original.

### Execução

Para rodar a aplicação completa, você precisará de **5 terminais** (ou 4, se rodar o Cliente Web pelo VS Code).

1.  **Terminal 0: Iniciar o RabbitMQ (via Docker)**
    ```bash
    docker run -d --hostname my-rabbit --name some-rabbit -p 5672:5672 -p 15672:15672 rabbitmq:3-management
    ```

2.  **Terminal 1: Iniciar Serviço SOAP (Python)**
    ```bash
    cd service-soap-rewards
    # Ative o venv e rode o app.py
    ```

3.  **Terminal 2: Iniciar Serviço REST (Node.js)**
    ```bash
    cd service-rest-habits
    node app.js
    ```

4.  **Terminal 3: Iniciar o Consumidor SOAP (Python)**
    ```bash
    cd service-soap-consumer
    # Ative o venv e rode o consumer.py
    ```

5.  **Terminal 4: Iniciar o API Gateway (Node.js)**
    ```bash
    cd gateway
    node app.js
    ```

Após iniciar todos os serviços, acesse o **Cliente Web** e o **Cliente Admin** como antes.

---

## Documentação da API

Acesse a documentação interativa da API (Swagger) na URL:
`http://localhost:8080/api-docs`

A documentação do serviço SOAP (WSDL) está em:
`http://localhost:7789/?wsdl`