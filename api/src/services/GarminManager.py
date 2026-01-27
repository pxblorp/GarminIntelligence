from garminconnect import Garmin

class _GarminManager:
    def __init__(self):
        self.client_store : dict[str, Garmin] = {}

    def add_client(self, email: str, password: str, timeout: int = 30) -> Garmin:
        if email in self.client_store:
            return self.client_store[email]
        
        client = Garmin(email, password)
        # Set timeout on the underlying garth client
        client.garth.timeout = timeout
        client.login()
        self.client_store[email] = client
        return client

    def get_client(self, email: str) -> Garmin | None:
        return self.client_store.get(email)

    def remove_client(self, email: str) -> None:
        if email in self.client_store:
            del self.client_store[email]

    def close_all(self) -> None:
        self.client_store.clear()
        

garmin_manager = _GarminManager()