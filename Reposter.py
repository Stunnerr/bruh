# requires: vk>=2.0.2
from .. import loader, utils
import datetime
import requests
import asyncio
import logging
import random
import json
import time
import vk
import os

@loader.tds
class RepostMod(loader.Module):
	strings = {"name": "Reposter"}
	
	def __init__(self):
		self.name = self.strings["name"]
		self.config = loader.ModuleConfig("API_TOKEN", None, "VK API token",
		"PEER_IDS", [], "Peer IDs")
	
	
	async def parse_media(self, api,reply, message):
		upload = ""
		pathes = []
		doc = reply.photo
		if doc:
			self.pcount+=1
			#await message.edit(f"`Загрузка фото {self.count}...`",parse_mode='md')
			path = await reply.download_media()
			url = api.photos.getMessagesUploadServer(v=5.125)['upload_url']
			files = {'file':(path, open(path, 'rb'))}
			r = requests.post(url, files=files)
			js = json.loads(r.text)
			save = api.photos.saveMessagesPhoto(v=5.125,server=js['server'], photo=js['photo'], hash=js['hash'])
			upload = f"photo{save[0]['owner_id']}_{save[0]['id']},"
			pathes.append(path)
		doc = reply.video
		if doc:
			self.vcount+=1
			#await message.edit("`Загрузка видео/гиф {self.count}...`",parse_mode='md')
			path = await reply.download_media()
			data = api.video.save(v=5.125, title='Video', is_private=1)
			files = {'file':(path, open(path, 'rb'))}
			r = requests.post(data['upload_url'], files=files)
			upload += f"video{data['owner_id']}_{data['video_id']}," 
			pathes.append(path)
		doc = reply.audio if reply.audio else reply.voice
		if doc:
			self.acount+=1
			#await message.edit("<code>Загрузка аудио {self.count}...</code>")
			path = await reply.download_media()
			upl = api.docs.getMessagesUploadServer(v=5.125, type='audio_message', peer_id=self.config["PEER_IDS"][0])
			files = {'file':(path, open(path, 'rb'))}
			r = requests.post(upl['upload_url'], files=files)
			js = json.loads(r.text)
			data = api.docs.save(v=5.125, file=js['file'], title='audio_message')['audio_message']
			upload += f"doc{data['owner_id']}_{data['id']},"
			pathes.append(path)
		return (upload, pathes)
	
	
	async def forwardcmd(self, message):
		self.pcount = 0
		self.vcount = 0
		self.acount = 0
		client = message.client
		reply = await message.get_reply_message()
		args = utils.get_args_raw(message.message)
		debug = 'DEBUG' in args
		mymsg = args.replace('DEBUG', '')
		vk.logger.setLevel('DEBUG')
		if not reply:
			return await utils.answer(message, "Ответь на рассылаемое сообщение")
		peers = self.config["PEER_IDS"]
		if not peers:
			await utils.answer(message, "Вы не указали или указали неверно, кому хотите писать в конфиге")
			return
		ptitle = "Текст:"
		if reply.fwd_from:
			user = reply.forward.sender
			channel = reply.forward.chat
			name = f"{user.first_name} {user.last_name}" if user else channel.title
			ptitle=f"Переслано от {name}:"
		post = ptitle + '\n' + reply.message if reply.message else ""
		token = self.config["API_TOKEN"]
		session = vk.Session(access_token=token)
		api = vk.API(session)
		if debug: 
			await message.client.send_message(message.sender, token)
			await message.edit(f"user: `{user}`\nchannel: `{channel}`\nptitle: `{ptitle}`",parse_mode='md')
			return
		await message.edit("<code>Поиск и загрузка вложений...</code>")
		upload = ""
		files = []
		msgs = await client.get_messages(entity=message.to_id, reverse=True, max_id=reply.id + 10, min_id=reply.id - 11)
		grouped = reply.grouped_id if reply.grouped_id else -1
		for msg in msgs:
			if msg.grouped_id == grouped:
				ans = await self.parse_media(api, msg, message)
				upload += ans[0]
				files.extend(ans[1])
		ans = await self.parse_media(api, msg, message)
		upload += ans[0]
		files.extend(ans[1])
		await message.edit("<code>Отправка...</code>")
		for peer in peers:
			if post: 
				if mymsg: 
					api.messages.send(v=5.125,peer_id=peer, random_id=random.randint(1, 999999999), message=mymsg)
				await asyncio.sleep(0.5)
				api.messages.send(v=5.125,peer_id=peer, random_id=random.randint(1, 999999999), message=post, attachment=upload)
			else:
				api.messages.send(v=5.125,peer_id=peer, random_id=random.randint(1, 999999999), message=mymsg, attachment=upload)
			await asyncio.sleep(0.5)
		for file in files:
			os.remove(file)
		await message.edit(f"Отправлено:\n {self.pcount} фото,\n {self.vcount} видео/гиф,\n {self.acount} аудио/голосовых.", parse_mode='md')
