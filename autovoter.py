from .. import loader, utils
from telethon import events
from telethon.tl.custom import Message
from telethon.tl.functions.messages import SendVoteRequest

@loader.tds
class autovoterMod(loader.Module):
    data = {
        'bot_id': 445079418,
        'chat_id': -1001227323951,
        'option': b"4"
    }
    strings = {"name": "autovoter"}

    def __init__(self):
        self.name = self.strings["name"]
    async def client_ready(self, client, db):
        client.add_event_handler(handler, events.NewMessage(from_users=[data['bot_id']], chats=[data["chat_id"]]))
    async def handler(event):
        message = event.message
        if not message.poll: 
            return
        client = message.client
        await client(SendVoteRequest(data["chat_id"], message.id, [data["option"]]))
