const { Client } = require('discord.js')

class LockableClient extends Client
    {
    constructor(options)
        {
        super(options);
        this.locked = false;
        }

    Lock()
        {
        this.locked = true;
        }
  
    Unlock()
        {
        this.locked = false;
        }
    
    SetLocked(locked)
        {
        return this.locked = locked;
        }

    IsLocked()
        {
        return this.locked;
        }
    }

module.exports = LockableClient;