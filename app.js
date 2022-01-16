const config = require("./config.json");
const sentences = require("./sentences.json");

const fs = require('fs');
const Discord = require('discord.js');
const LockableClient = require('./lockable-client.js');
const GoogleTextToSpeech = require('./google-api.js');
const Logger = require("./logger.js");

const client = new LockableClient();
const googleApi = new GoogleTextToSpeech();
const logger = new Logger();
client.login(config.token);

var servers = {};
var isCurrentlyPlaying = false;
var introText = "Hello";
var currentChannel = null;
var currentConnection = null;

function append_sentence(server, pText, pLang, pGender)
	{
	if (currentChannel == null || currentConnection == null)
		{
		return;
		}

	googleApi.SetFileName();
	server.queue.push({ text: pText, lang: pLang, gender: pGender, fileName: googleApi.GetFileName() });
	googleApi.SetGender(pGender);
	googleApi.SetLang(pLang);
	googleApi.SetText(pText);
	googleApi.ConvertTextToSpeech();
	}

function say(connection, fileName)
	{
	isCurrentlyPlaying = true;
	setTimeout(function()
		{
		const dispatcher = connection.play(fileName, { volume: 0.5 });

		dispatcher.on('error', function(error)
			{
			isCurrentlyPlaying = false;
			dispatcher.destroy();
			});

		dispatcher.on('finish', function()
			{
			isCurrentlyPlaying = false;

			fs.unlink(fileName, (e) => {
				if (e)
					{
					logger.Error("Error: Did not find file " + fileName);
					dispatcher.destroy();
					return;
					}
				});

			dispatcher.destroy();
			});
		}, 1500);
	isCurrentlyPlaying = false;
	}

async function say_all(server, index, voiceChannel, connection)
	{
	if (voiceChannel == null || connection == null)
		{
		return;
		}

	if (index == server.queue.length) // End of queue
		{
		server.queue = [];
		return;
		}

	var current = server.queue[index];
	if (isCurrentlyPlaying)
		{
		// User requested to add a sentence but there is currently something playing
		logger.Log("Something is currently playing! Re-Adding the current sentence");
		append_sentence(server, current.text, current.lang, current.gender);
		say(connection, server.queue[index + 1].fileName);
		return;
		}

	say(connection, current.fileName);
	say_all(server, index + 1, voiceChannel, connection);
	}

function get_server(client, id)
	{	
	if (!servers[id])
		{
		servers[id] = { queue: [], instance: [], serverID: id };
		}

	var server = servers[id];
	if (!server.instance.includes(client))
		{
		server.instance.push(client);
		}

	return server;
	}

function get_random_index(begin, end)
	{
	return Math.floor(Math.random() * end) + begin % end;
	}

function join_channel(channel)
	{
	logger.Info("Bot joining the channel...");
	currentChannel = channel;

	setTimeout(function() // Workaround, wait 4 seconds before establishing the connection to the voice channel, @see https://github.com/discordjs/discord.js/issues/2979
		{
		channel.join()
		.then(function(connection)
			{
			logger.Log("Bot has joined the channel successfully!");
			currentConnection = connection;
			})
		.catch(function(error)
			{
			logger.Error("Connection timeout, trying to reconnect in 4 seconds...");
			join_channel(channel);
			});
		}, 4000);
	}

function leave_channel()
	{
	logger.Log("Bot leaving the channel!");
	currentConnection.disconnect();
	currentChannel.leave();
	currentChannel = null;
	currentConnection = null;
	}

client.on('voiceStateUpdate', function(oldState, newState)
	{
	if (oldState.member.user.bot)
		{
		return;
		}

	if (currentChannel == null || currentConnection == null)
		{
		return;
		}

	if (newState.channel == null) 
		{
		// User hat den Voice channel verlassen
		var username = oldState.member.displayName;
		var server = get_server(client, oldState.channel.guild.id);
		logger.Info(username + " has left!");

		append_sentence(server, username.toLowerCase() + " hat den Server verlassen!", "de-DE", "MALE");
		say_all(server, 0, currentChannel, currentConnection);
		return;
		}

	if (oldState.channel == null && newState.channel != null)
		{
		// User hat den Voice channel betreten
		var username = newState.member.displayName;
		var id = newState.channel.guild.id;
		var server = get_server(client, id);
		logger.Info(username + " has joined");

		// iterate trough json file and 
		var entryFound = false;
		for (var key in sentences)
			{
			var obj = sentences[key];
			if (newState.member.user.id === obj.id && id === obj.serverID)
				{
				entryFound = true;
				// Get a random index and choose any sentence of the user randomly
				var text = obj.text[get_random_index(0, 3)];
				append_sentence(server, text, obj.lang, obj.gender);
				}
			}

		if (!entryFound)
			{
			append_sentence(server, introText + ' ' + username, googleApi.GetLang(), googleApi.GetGender());
			}

		say_all(server, 0, currentChannel, currentConnection);
		}
	});

client.on('message', function(msg)
	{
	// Start command and end command
	var msgText = msg.content.toLowerCase();
	var server = get_server(client, msg.guild.id);
	var username = msg.author.username;

	if (msgText.startsWith("!say"))
		{
		var text = msgText.substring(5);
		text = text.replace("\n", "");
		
		// check if bot is in a voice channel
		if (currentChannel == null || currentConnection == null)
			{
			// send error
			msg.reply("The bot has to join the channel first! Use !papageJoin to do so.");
			return;
			}

		logger.Info(username + " said: " + text);
		append_sentence(server, text, googleApi.GetLang(), googleApi.GetGender());
		say_all(server, 0, currentChannel, currentConnection);
		}

	if (msgText.startsWith("!lang"))
		{
		var lang = msgText.substring(6);
		lang = lang.toLowerCase();
		for (var key in config.languages)
			{
			var current = config.languages[key];
			if (lang === current.id)
				{
				googleApi.SetLang(current.lang);
				introText = current.introText;
				logger.Info(username + " set the language to " + current.lang.toLowerCase());
				msg.reply("The language has been set to " + current.lang.toLowerCase());
				break;
				}
			}
		}

	if (msgText.startsWith("!gender"))
		{
		var gender = msgText.substring(8);
		gender = gender.toLowerCase();
		for (var key in config.genders)
			{
			var currentGender = config.genders[key];
			if (currentGender.id.includes(gender))
				{
				googleApi.SetGender(currentGender.gender);
				logger.Info(username + " set the gender to " + currentGender.gender.toLowerCase());
				msg.reply("The gender has been set to " + currentGender.gender.toLowerCase());
				break;
				}
			}
		}

	if (msgText === "!papageijoin")
		{
		if (msg.member.voice.channel == null)
			{
			// send error
			msg.reply("You can not use this command if you are not in a voice channel!");
			return;
			}

		// Join server channel and stay until leave command occurs
		if (currentChannel == null)
			{
			// Join channel
			msg.reply("The Bot will now join your channel!");			
			join_channel(msg.guild.members.cache.get(msg.author.id).voice.channel);
			}
		else
			{
			msg.reply("The Bot already joined your channel!");
			}
		}
	
	if (msgText === "!papageileave")
		{
		// Leave server channel
		if (currentChannel != null)
			{
			server.queue = [];
			msg.reply("The Bot will now leave your channel!");
			leave_channel();
			}
		else
			{
			msg.reply("The Bot already left your channel!");
			}
		}

	if (msgText === "!stats")
		{
		logger.Info(username + " requested the stats!");
		var embed = new Discord.MessageEmbed().setAuthor('ThePapagei').setDescription('**current lang:** ' + googleApi.GetLang() + '\n**current gender:** ' + googleApi.GetGender() + "\n").setColor('#ff0000');
		msg.channel.send(embed);
		}

	if (msgText === "!help")
		{
		logger.Info(username + " requested help!");
		var langText = "";
		var genderText = "";
		for (var key in config.languages)
			{
			var current = config.languages[key];
			langText += "- " + current.displayName + "\n";
			}

		for (var key in config.genders)
			{
			var current = config.genders[key];
			genderText += "- " + current.displayName + "\n";
			}

		var commandText = "";
		commandText += "- !papageiJoin - Join my current voice channel\n";
		commandText += "- !papageiLeave - Leave my current voice channel\n";
		commandText += "- !say <text> - Say a custom text (**Needs the command !papageiJoin to be executed first!**)\n";
		commandText += "- !gender <genderCode> - Set the gender of the voice. **Choose one of these options:**\n";
		commandText += "    - for male enter **!gender m** or **!gender male**\n";
		commandText += "    - for female enter **!gender f** or **!gender female**\n";
		commandText += "    - for neutral enter **!gender n** or **!gender neutral**\n";
		commandText += "- !lang <languageCode> - Set the language in which the bot should speak. **Choose one of these options:**\n";
		commandText += "    - for german enter **!lang de**\n";
		commandText += "    - for english (british) enter **!lang gb**\n";
		commandText += "    - for english (american) enter **!lang en**\n";
		commandText += "    - for turkish enter **!lang tr**\n";
		commandText += "    - for russian enter **!lang ru**\n";
		commandText += "    - for french enter **!lang fr**\n";

		var embed = new Discord.MessageEmbed().setAuthor('ThePapagei Help Menu').setDescription('This is the Help menu of the Papagei Bot').setColor('#ff0000');
		embed.addField('Important Commands:', commandText);
		embed.addField('Available languages:', langText);
		embed.addField('Available Genders:', genderText);
		msg.channel.send(embed);
		}

	if (msgText === "!info")
		{
		logger.Info(msg.author.username + " requested info!");
		var embed = new Discord.MessageEmbed().setAuthor('About ThePapagei').setDescription('[Invite Link](https://discord.com/oauth2/authorize?client_id=784367842069184532&scope=bot)\n[The Papagei on Github](https://www.github.com/Cankar001/ThePapageiBot)\n[Website](https://www.cankarka.com)\n').setColor('#ff0000');
		msg.channel.send(embed);
		}
	});

client.on('ready', function()
	{
	logger.Log("Application has started!");
	logger.Log("Discord Version: " + Discord.version);
	});

client.on("warn", (info) => logger.Warn(info));
client.on("error", console.error);
//client.on("debug", console.debug);

