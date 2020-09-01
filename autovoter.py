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
            'option', b"4","",
            'enabled', '1', "",
            'onwin', '', "")
        super().__init__()
    async def avtogglecmd(self,message):
        client = message.client
        enabled = self.config['enabled']
        if enabled == '1':
            client.remove_event_handler(self.handler)
            enabled = '0'
            await message.edit('Disabled')
        else:
            client.add_event_handler(self.handler, events.NewMessage(from_users=self.config['bot_id'], chats=self.config["chat_id"]))
            enabled = '1'
            await message.edit('Enabled')
        self.config['enabled'] = enabled
    async def handler(self, event):
        message = event.message
        client = message.client
        if message.dice and message.dice.value == int(self.config['option']):
            await message.respond(self.config['onwin'])
        if message.buttons: 
            if b'give' in message.buttons[0][0].data: 
                if (await client.get_me()).id == message.entities[0].user_id:
                    await message.click(0)
        if message.poll: 
            await client(SendVoteRequest(message.to_id, message.id, [self.config["option"]]))
    
    async def client_ready(self, client, db):
        self.client = client
        enabled = self.config['enabled']
        if enabled != '1':
            client.remove_event_handler(self.handler)
        else:
            client.add_event_handler(self.handler, events.NewMessage(from_users=self.config['bot_id'], chats=self.config["chat_id"]))
