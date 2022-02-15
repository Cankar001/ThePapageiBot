class Logger
    {
    constructor()
        {
        }

    GetCurrentDateTimeStr()
        {
        var date = new Date();
        var dateStr = "";
        var timeStr = "";
        
        date.setDate(date.getDate() + 20);
        
        dateStr = ('0' + date.getDate()).slice(-2) + '.'
                        + ('0' + (date.getMonth()+1)).slice(-2) + '.'
                        + date.getFullYear();

        timeStr = date.getHours() + ":" + date.getMinutes() + ":" + date.getSeconds();

        return "[" + dateStr + " - " + timeStr + "] ";
        }

    Print(text)
        {
        console.log("\x1b[1m\x1b[37m", this.GetCurrentDateTimeStr() + text);
        }

    Error(text)
        {
        console.log("\x1b[1m\x1b[31m", this.GetCurrentDateTimeStr() + text);
        }

    Log(text)
        {
        console.log("\x1b[1m\x1b[32m", this.GetCurrentDateTimeStr() + text);
        }

    Warn(text)
        {
        console.log("\x1b[1m\x1b[33m", this.GetCurrentDateTimeStr() + text);
        }

    Info(text)
        {
        console.log("\x1b[1m\x1b[34m", this.GetCurrentDateTimeStr() + text);
        }
    }

module.exports = Logger;