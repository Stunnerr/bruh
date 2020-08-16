from .. import loader, utils
from telethon import events
from telethon.tl.custom import Message
from telethon.tl.functions.messages import SendVoteRequest


class autovotermod(loader.Module):
    data = {
        'bot_id': 931448009,
        'chat_id': -1001227323951,
        'option': b"4"
    }

    @borg.on(events.NewMessage(from_users=[data['bot_id']], chats=[data["chat_id"]]))
    async def handler(message: Message):
        if not message.poll:
            return
        client = message.client
        await client(SendVoteRequest(data["chat_id"], message.id, [data["option"]]))
