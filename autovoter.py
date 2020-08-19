from .. import loader, utils
from telethon import events
from telethon.tl.custom import Message
from telethon.tl.functions.messages import SendVoteRequest

@loader.tds
class autovoterMod(loader.Module):
    strings = {"name": "autovoter"}
    def __init__(self):
        self.name = self.strings["name"]
        self.config = loader.ModuleConfig(
            'bot_id', 931448009, "",
            'chat_id', -1001227323951,"",
            'option', b"4","")
        super().__init__()
    async def handler(self, event):
        message = event.message
        client = message.client
        if message.buttons: 
            if "ОТДАТЬ" in message.buttons[0][0].text: 
                await message.click(0)
        if message.poll: 
            await client(SendVoteRequest(message.to_id, message.id, [self.config["option"]]))
    
    async def client_ready(self, client, db):
        self.client = client
        client.add_event_handler(self.handler, events.NewMessage(from_users=self.config['bot_id'], chats=self.config["chat_id"]))
