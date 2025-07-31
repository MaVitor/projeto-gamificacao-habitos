# Importando as classes necessárias do Spyne
from spyne import Application, rpc, ServiceBase, Integer, Unicode, Boolean, Iterable, ComplexModel
from spyne.protocol.soap import Soap11
from spyne.server.wsgi import WsgiApplication
from werkzeug.serving import run_simple

# Definindo um "modelo complexo" para o perfil do usuário.
# Isso será traduzido para uma estrutura no arquivo WSDL.
class UserProfile(ComplexModel):
    userId = Unicode
    points = Integer
    badges = Iterable(Unicode)

# Criando um dicionário para simular nosso banco de dados
mock_database = {
    "user-1": UserProfile(userId="user-1", points=150, badges=["Primeiro Hábito", "Sequência de 7 Dias"]),
    "user-2": UserProfile(userId="user-2", points=50, badges=["Primeiro Hábito"]),
}


# Nossos serviços são definidos como classes que herdam de ServiceBase
class RewardService(ServiceBase):
    
    # A anotação @rpc marca um método como uma operação remota que pode ser chamada.
    # Aqui definimos os tipos de entrada (_in_name) e o tipo de retorno (_returns).
    @rpc(Unicode, _returns=UserProfile)
    def getUserProfile(ctx, userId):
        """Busca o perfil de um usuário com seus pontos e medalhas.
           Documentação da operação aparecerá no WSDL.
        """
        print(f"Buscando perfil para o usuário: {userId}")
        # Retorna o usuário do nosso "banco de dados" mockado.
        return mock_database.get(userId)

    @rpc(Unicode, Integer, _returns=Boolean)
    def creditPoints(ctx, userId, points):
        """Credita pontos a um usuário."""
        if userId in mock_database:
            mock_database[userId].points += points
            print(f"Creditando {points} pontos para {userId}. Novo total: {mock_database[userId].points}")
            return True
        print(f"Usuário {userId} não encontrado para creditar pontos.")
        return False

# Criamos uma aplicação Spyne, damos um nome a ela e definimos o serviço.
application = Application([RewardService],
    # O namespace é um identificador único para o nosso serviço.
    tns='br.com.empresa.gamificacao.rewards',
    # Definimos o protocolo de entrada e saída como SOAP 1.1.
    in_protocol=Soap11(validator='lxml'),
    out_protocol=Soap11()
)

# Criamos uma aplicação WSGI padrão a partir da nossa aplicação Spyne.
wsgi_application = WsgiApplication(application)


if __name__ == '__main__':
    # Usamos o Werkzeug para iniciar um servidor de desenvolvimento simples.
    host = '127.0.0.1'
    port = 7789
    print(f"Serviço SOAP de Recompensas iniciado em http://{host}:{port}")
    print(f"Acesse o WSDL em: http://{host}:{port}/?wsdl")
    
    run_simple(host, port, wsgi_application)