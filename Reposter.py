# requires: vk>=2.0.2
from .. import loader
from .. import utils
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
		"PEER_IDS", [], "Peer IDs")
	async def parse_media(api,reply):
		upload = ""
		doc = reply.photo
		await message.edit("`Поиск вложений...`",parse_mode='md')
		if doc:
			await message.edit("`Загрузка фото...`",parse_mode='md')
			path = await reply.download_media()
			url = api.photos.getMessagesUploadServer(v=5.125)['upload_url']
			files = {'file':(path, open(path, 'rb'))}
			r = requests.post(url, files=files)
			js = json.loads(r.text)
			save = api.photos.saveMessagesPhoto(v=5.125,server=js['server'], photo=js['photo'], hash=js['hash'])
			upload = f"photo{save[0]['owner_id']}_{save[0]['id']},"
		doc = reply.video
		if doc:
			await message.edit("`Загрузка видео/гиф...`",parse_mode='md')
			path = await reply.download_media()
			data = api.video.save(v=5.125, title='Video', is_private=1)
			files = {'file':(path, open(path, 'rb'))}
			r = requests.post(data['upload_url'], files=files)
			upload += f"video{data['owner_id']}_{data['video_id']},"
		doc = reply.audio if reply.audio else reply.voice
		if doc:
			await message.edit("<code>Загрузка аудио...</code>")
			path = await reply.download_media()
			upl = api.docs.getMessagesUploadServer(v=5.125, type='audio_message', peer_id=peers[0])
			files = {'file':(path, open(path, 'rb'))}
			r = requests.post(upl['upload_url'], files=files)
			js = json.loads(r.text)
			data = api.docs.save(v=5.125, file=js['file'], title='audio_message')['audio_message']
			upload += f"doc{data['owner_id']}_{data['id']},"
		return upload
	async def forwardcmd(self, message):
		reply = await message.get_reply_message()
		args = utils.get_args_raw(message.message)
		debug = 'DEBUG' in args
		mymsg = args.replace('DEBUG', '')
		vk.logger.setLevel('DEBUG')
		if not reply:
			return await utils.answer(message, "<code>R e p o s t e r</code>\nОтветьте на рассылаемое сообщение")
		peers = self.config["PEER_IDS"]
		if not peers:
			await utils.answer(message, "Вы не указали или указали неверно, кому хотите писа
