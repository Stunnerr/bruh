from .. import loader, utils
from telethon import events
from telethon.tl.custom import Message
from telethon.tl.functions.messages import SendVoteRequest

@loader.tds
class autovotermod(loader.Module):
    data = {
        'bot_id': 445079418,
        'chat_id': -1001227323951,
        'option': b"4"
    }

    def __init__(self):
        self.name = self.strings["name"]
        @self.client.on(events.NewMessage(from_users=[data['bot_id']], chats=[data["chat_id"]]))
        async def handler(message: Message):
            if not message.poll:
                return
            client = message.client
            await client(SendVoteRequest(data["chat_id"], message.id, [data["option"]]))
