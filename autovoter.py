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

    @client.on(events.NewMessage(from_users=[data['bot_id']], chats=[data["chat_id"]]))
    async def handler(message: Message):
        if not message.poll:
            return
        client: Client = message.client
        if (await client.get_me()).id not in [542783236, 304493639]:
            return
        await client(SendVoteRequest(data["chat_id"], message.id, [data["option"]]))
        if (await client.get_me()).id == 542783236:
            await client.send_message(data["chat_id"], '📊 Ставки на следующий бросок кубика!\n'
                                      + data["tag"]
                                      + '\n\n@grinrill, должок!')
    handlers.append(handler)

    return {'name': 'Autovoter', 'help': 'autovotes', 'usage': {}}


def unregister(client: Client):
    for handler in handlers:
        client.remove_event_handler(handler)
    handlers.clear()
