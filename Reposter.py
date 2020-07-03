# requires: vk>=2.0.2
from .. import loader, utils
import requests
import logging
import datetime
import time
import asyncio
import vk
import json
import random

@loader.tds
class RepostMod(loader.Module):
	strings = {"name": "Reposter"}
	def __init__(self):
		self.name = self.strings["name"]
		self.config = loader.ModuleConfig("API_TOKEN", None, "VK API token",
		"PEER_IDS", [0], "Peer IDs")
	async def forwardcmd(self, message):
		reply = await message.get_reply_message()
		args = utils.get_args_raw(message.message)
		if not reply:
			return await utils.answer(message, "Ответьте на рассылаемое сообщение")
		peers = self.config["PEER_IDS"]
		if 0 in peers:
			await utils.answer(message, "Вы не указали или указали неверно, кому хотите писать в конфиге")
			return
		fname = str(random.randint(1,100)) + '.png'
		mymsg = "\nКомментарий:" + '\u2002'.join(('\n'+ args).splitlines(True)) if args else ""
		post = '\nТекст поста/пересылаемого сообщения:'+ '\u2002'.join(('\n' + reply.message).splitlines(True)) if reply.message else ""
		msg = mymsg + post 
		token = self.config["API_TOKEN"]
		session = vk.Session(access_token=token)
		api = vk.API(session)
		doc = reply.photo
		upload = ""
		if doc:
			path = await reply.download_media()
			url = api.photos.getMessagesUploadServer(v=5.125)['upload_url']
			files = {'file':(path, open(path, 'rb'))}
			r = requests.post(url, files=files)
			js = json.loads(r.text)
			save = api.photos.saveMessagesPhoto(v=5.125,server=js['server'], photo=js['photo'], hash=js['hash'])
			upload = f"photo{save[0]['owner_id']}_{save[0]['id']}"
		doc = reply.video
		if doc:
			path = await reply.download_media()
			cid = reply.fwd_from.channel_id
			title = None
			if cid:
				channel = await message.client.get_entity(cid)
				title = 'Video from ' + channel.title
			data = api.video.save(v=5.125, title=title, is_private=1)
			files = {'file':(path, open(path, 'rb'))}
			r = requests.post(data['upload_url'], files=files)
			upload += f",video{data['owner_id']}_{data['video_id']}"
		for peer in peers:
			api.messages.send(v=5.125,peer_id=peer, random_id=random.randint(1, 999999999),message=msg,attachment=upload)
		await message.edit("Success")
