from .. import loader, utils
from telethon import events
from telethon.tl.custom import Message
from telethon.tl.functions.messages import SendVoteRequest

@loader.tds
class autovoterMod(loader.Module):
    data = {
        'bot_id': [445079418],
        'chat_id': [-1001227323951],
        'option': b"4"
    }
    strings = {"name": "autovoter"}

    def __init__(self):
        self.name = self.strings["name"]
        self.config = loader.ModuleConfig(
            'bot_id', 445079418, "",
            'chat_id', -1001227323951,"",
            'option', b"4","")
        super().__init__()
    async def client_ready(self, client, db):
        self._client = client
        await client.send_message(await client.get_me(), 'client_ready')
        @client.on(events.NewMessage(from_users=self.config['bot_id'], chats=self.config["chat_id"]))
        async def handler(event):
            message = event.message
            if not message.poll: 
                return
            client = message.client
            await client.send_message(await client.get_me(), 'handler')
            await client(SendVoteRequest(self.config["chat_id"], message.id, [self.config["option"]]))
        client.add_event_handler(handler, events.NewMessage(from_users=self.config['bot_id'], chats=self.config["chat_id"]))
