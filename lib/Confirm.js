const {Readable} = require('stream')


class Confirm extends Readable
{
  constructor(readable, inFlight, {ackPrefix = 'ack', ...options} = {})
  {
    super({...options, objectMode: true})

    const regExp = new RegExp(`${ackPrefix}(.+)`)

    readable
    .on('data', data =>
    {
      if(typeof data === 'string')
      {
        const match = data.match(regExp)

        if(match)
        {
          const [, id] = match

          this.emit('landed', id, inFlight.get(id))
          inFlight.delete(id)

          if(!inFlight.size) this.emit('allLanded')

          return
        }
      }

      if(!this.push(data)) readable.pause()
    })
    .once('end', this.push.bind(this, null))

    this._readable = readable
  }

  _read()
  {
    this._readable.resume()
  }
}


module.exports = Confirm
