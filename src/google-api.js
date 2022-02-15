const fs = require('fs');
const util = require('util');
const textToSpeech = require('@google-cloud/text-to-speech');

const googleClient = new textToSpeech.TextToSpeechClient();

class GoogleTextToSpeech
    {
    constructor()
        {
        this.text = "";
        this.fileName = "temp_" + new Date().getTime() + ".mp3";
        this.lang = "en-US";
        this.gender = "MALE";
        }
    
    async ConvertTextToSpeech()
        {
        // Construct the request
        const request =
			{
			input: { text: this.text },

			// Select the language and SSML voice gender (optional)
			voice: { languageCode: this.lang, ssmlGender: this.gender },

			// select the type of audio encoding
			audioConfig: { audioEncoding: 'MP3' },
			};

        // Performs the text-to-speech request
        const [response] = await googleClient.synthesizeSpeech(request);

        // Write the binary audio content to a local file
        const writeFile = util.promisify(fs.writeFile);
        await writeFile(this.fileName, response.audioContent, 'binary');
        }

    async ConvertSpeechToText()
        {
        // TODO
        }

    SetFileName()
        {
        this.fileName = "temp_" + new Date().getTime() + ".mp3";
        }

    SetText(text)
        {
        this.text = text;
        }

    SetGender(gender)
        {
        this.gender = gender;
        }

    SetLang(lang)
        {
        this.lang = lang;
        }

    GetFileName()
        {
        return this.fileName;
        }

    GetGender()
        {
        return this.gender;
        }

    GetLang()
        {
        return this.lang;
        }

    GetText()
        {
        return this.text;
        }
    }

module.exports = GoogleTextToSpeech;