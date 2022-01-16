# ThePapageiBot

The Papgagei Bot is a Discord bot aimed to re-say everything you type!
You can define pre-defined sentences which should be said if a user joins the voice channel.

# Getting started

To install and run the bot you have to execute some steps first:

1. install all node modules with:
```shell
npm install
```

2. a google billing capable account is required, create your custom credentials (business account) and download your credentials json file
3. place your credentials json file anywhere in your file system and put this path into the `start.sh` script.
4. make the `start.sh` script executable with `sudo chmod +x start.sh`
5. execute the `start.sh` script, if you did all right the server should welcome you with the message "Application has started!"

# Defining Custom User Sentences

To define a custom sentence or word which should be said if a specific user joins the voice channel you have to activate the developer mode in discord (only if you want to add a new sentence, it is not necessary to use the feature).
Then go to the target user account and click "right click on the user" > "Copy ID" to copy the userID of the discord user.

Now open the sentences.json file and paste the userID as the value for the `id` field. Now do the same with the `serverID` (right click on server, copy ID, paste into `serverID` field).
Now you can add 3 sentences to the `text` array, they can be as long as you want.

The `lang` field must be filled with the language code and the `gender` field with the desired gender, here is a minimal example:

```json
{
    "some_demo_label" :
    {
        "id" : "<USERID>",
        "serverID" : "<SERVERID>",
        "text": [ "TEXT1", "TEXT2", "TEXT3" ],
        "lang" : "de-DE", // or en-EN or en-GB or tr-TR or ru-RU or fr-FR (in JSON comments are not supported, so remove these comments if you use this sample)
        "gender" : "MALE" // or FEMALE or NEUTRAL (in JSON comments are not supported, so remove these comments if you use this sample)
    },
}
```

