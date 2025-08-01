import pika
import json
import zeep # <-- Importação correta

# --- Configurações ---
RABBITMQ_HOST = 'localhost'
QUEUE_NAME = 'habits_queue'
SOAP_WSDL_URL = 'http://localhost:7789/?wsdl'
POINTS_TO_CREDIT = 10

# Tenta conectar ao serviço SOAP ao iniciar.
try:
    zeep_client = zeep.Client(wsdl=SOAP_WSDL_URL)
    print("[✔] Cliente SOAP conectado ao WSDL com sucesso.")
except Exception as e:
    print(f"[!] Falha ao conectar ao WSDL em {SOAP_WSDL_URL}.")
    print("[!] Por favor, verifique se o serviço SOAP (service-soap-rewards) está rodando antes de iniciar este consumidor.")
    exit() # Encerra o script se não conseguir conectar.


def callback(ch, method, properties, body):
    """
    Função executada toda vez que uma mensagem é recebida da fila.
    """
    print(f" [x] Mensagem recebida: {body.decode()}")
    
    try:
        data = json.loads(body)
        user_id = data.get('userId')
        
        if user_id:
            print(f"[*] Chamando serviço SOAP para creditar {POINTS_TO_CREDIT} pontos para o usuário {user_id}...")
            
            # Chama a operação 'creditPoints' usando a sintaxe do Zeep
            response = zeep_client.service.creditPoints(userId=user_id, points=POINTS_TO_CREDIT)
            
            if response: # A operação retorna True em caso de sucesso
                print(f" [✔] Pontos creditados com sucesso para {user_id}!")
            else:
                print(f" [!] Falha ao creditar pontos para {user_id} (usuário não encontrado no serviço SOAP).")
        
        # Confirma para o RabbitMQ que a mensagem foi processada
        ch.basic_ack(delivery_tag=method.delivery_tag)

    except Exception as e:
        print(f" [!] Erro ao processar mensagem: {e}")
        # Informa ao RabbitMQ que a mensagem não foi processada
        ch.basic_nack(delivery_tag=method.delivery_tag)


def main():
    connection = pika.BlockingConnection(pika.ConnectionParameters(host=RABBITMQ_HOST))
    channel = connection.channel()

    channel.queue_declare(queue=QUEUE_NAME, durable=True)
    print(' [*] Aguardando por mensagens. Para sair, pressione CTRL+C')
    
    channel.basic_consume(queue=QUEUE_NAME, on_message_callback=callback)

    channel.start_consuming()

if __name__ == '__main__':
    main()